import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const logToFile =
    process.env.LOG_TO_FILE === '1' || process.env.LOG_TO_FILE === 'true';
  const logDir = process.env.LOG_DIR || 'logs';
  if (logToFile) {
    const full = path.resolve(process.cwd(), logDir);
    fs.mkdirSync(full, { recursive: true });
  }

  const logger = WinstonModule.createLogger({
    level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
    defaultMeta: { service: 'task-service' },
    transports: [
      new transports.Console({
        level: process.env.CONSOLE_LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
        format: format.combine(format.timestamp(), format.json()),
      }),
      ...(logToFile
        ? [
            new transports.File({
              filename: path.join(logDir, 'error.log'),
              level: 'error',
            }),
            new transports.File({
              filename: path.join(logDir, 'combined.log'),
              level: process.env.FILE_LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
            }),
          ]
        : []),
    ],
  });

  const app = await NestFactory.create(AppModule, { logger });

  const rmqUrl =
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  const queue = 'task_queue';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue,
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();

  const port = 3003;
  await app.listen(port);

  logger.log(`🚀 task-service HTTP em http://localhost:${port}`, 'Bootstrap');
  logger.log(`RabbitMQ Queue: ${queue}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
