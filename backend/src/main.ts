// Entry point for NestJS application
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'https:', 'http:'],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );

  const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(url => url.trim());
  app.enableCors({
    origin: frontendUrls,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-signature', 'stripe-signature'],
    maxAge: 600,
  });

  app.use(express.json({ limit: '1mb' }));

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

  app.use('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = Number(process.env.API_PORT || process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API running on port ${port}`);
  console.log(`📡 CORS enabled for: ${frontendUrls.join(', ')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch(err => {
  console.error('❌ Application failed to start:', err);
  process.exit(1);
});
