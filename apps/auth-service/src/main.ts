import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = 3002;

  await app.listen(port);
}

bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
