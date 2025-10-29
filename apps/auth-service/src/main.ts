import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rmqUrl =
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
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

  console.log('[auth-service] HTTP listening on:', port);
  console.log('[auth-service] RabbitMQ URL:', rmqUrl);
  console.log('[auth-service] RabbitMQ Queue:', queue);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
