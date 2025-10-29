import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Collab Task API')
    .setDescription('Sistema de gerenciamento de tarefas colaborativo.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = 3001;

  await app.listen(port);
  console.log('🚀 API Gateway running on http://localhost:3001');
  console.log(
    '[api-gateway] RabbitMQ URL:',
    process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  );
  console.log('[api-gateway] Swagger docs:', 'http://localhost:3001/api/docs');
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
