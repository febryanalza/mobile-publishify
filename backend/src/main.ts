import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000' || 'http://10.0.2.2:4000',
    credentials: true,
  });

  // Compression
  app.use(compression());

  // Global prefix untuk semua API routes kecuali root & health
  app.setGlobalPrefix('api', {
    exclude: [
      '/', // Root route
      'health', // Health check
      'favicon.ico', // Browser favicon request
    ],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('API Publishify')
    .setDescription('Dokumentasi API untuk Sistem Penerbitan Naskah Publishify')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Endpoint untuk autentikasi dan otorisasi')
    .addTag('pengguna', 'Endpoint untuk manajemen pengguna')
    .addTag('naskah', 'Endpoint untuk manajemen naskah')
    .addTag('review', 'Endpoint untuk sistem review naskah')
    .addTag('percetakan', 'Endpoint untuk manajemen percetakan')
    .addTag('pembayaran', 'Endpoint untuk sistem pembayaran')
    .addTag('notifikasi', 'Endpoint untuk notifikasi real-time')
    .addTag('upload', 'Endpoint untuk upload file')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Publishify API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Aplikasi berjalan pada: http://localhost:${port}`);
  console.log(`📚 Dokumentasi API: http://localhost:${port}/api/docs`);
}

bootstrap();
