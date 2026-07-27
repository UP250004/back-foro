import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // CORS: permite que React consuma la API.
  app.enableCors({ origin: true, credentials: true });

  // ValidationPipe GLOBAL: sin esto, los @IsString(), @IsEmail(), etc. de los DTO
  // NO se ejecutan.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // borra propiedades que no estén declaradas en el DTO
      forbidNonWhitelisted: true, // y lanza 400 si llegan propiedades de más
      transform: true, // convierte tipos automáticamente ("20" -> 20)
    }),
  );

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  console.log(`API corriendo en http://localhost:${port}`);
}
bootstrap();
