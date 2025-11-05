import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggerService } from '@nestjs/common';
import { createLogger } from '@repo/shared-config';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const logger: LoggerService = createLogger({
    serviceName: 'task-service',
  }) as unknown as LoggerService;

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

  // roda migrations no bootstrap quando RUN_MIGRATIONS=true
  if (process.env.RUN_MIGRATIONS === 'true') {
    const dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  }

  const port = 3003;
  await app.listen(port);

  logger.log(`🚀 task-service HTTP em http://localhost:${port}`, 'Bootstrap');
  logger.log(`RabbitMQ Queue: ${queue}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
