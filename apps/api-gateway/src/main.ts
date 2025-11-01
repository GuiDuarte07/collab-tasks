import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createLogger } from '@repo/shared-config';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'api-gateway' });

  const app = await NestFactory.create(AppModule, { logger });

  app.setGlobalPrefix('api');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Collab Task API')
    .setDescription('Sistema de gerenciamento de tarefas colaborativo.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Insira o token JWT',
        in: 'header',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = 3001;

  await app.listen(port);
  app.getHttpAdapter().getInstance();

  // Logs informativos via Winston
  logger.log(`🚀 API Gateway rodando em http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
