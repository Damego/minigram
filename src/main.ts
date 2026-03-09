import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Глобальный префикс
  app.setGlobalPrefix('api');

  // Версионирование
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS
  app.enableCors();

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();