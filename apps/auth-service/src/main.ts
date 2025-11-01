import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggerService } from '@nestjs/common';
import { createLogger } from '@repo/shared-config';

async function bootstrap() {
  const logger: LoggerService = createLogger({
    serviceName: 'auth-service',
  }) as unknown as LoggerService;

  const app = await NestFactory.create(AppModule, { logger });

  const rmqUrl =
    process.env.RABBITMQ_URL ||
    (process.env.RABBITMQ_USER && process.env.RABBITMQ_PASSWORD
      ? `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}${process.env.RABBITMQ_VHOST ? `/${process.env.RABBITMQ_VHOST}` : ''}`
      : 'amqp://guest:guest@localhost:5672');
  const queue = 'auth_queue';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rmqUrl],
      queue,
      queueOptions: { durable: false },
    },
  });

  await app.startAllMicroservices();

  const port = 3002;
  await app.listen(port);

  logger.log(`🚀 auth-service HTTP em http://localhost:${port}`, 'Bootstrap');
  logger.log(`RabbitMQ Queue: ${queue}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
