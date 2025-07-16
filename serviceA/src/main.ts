/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Service A - Data Processor')
    .setDescription('API for data ingestion, file processing, and search operations')
    .setVersion('1.0')
    .addTag('data-fetcher', 'Streamed data fetching operations')
    .addTag('file-upload', 'File upload and parsing operations')
    .addTag('search', 'Database search operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(
    `🚀 Service A is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📚 Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();
