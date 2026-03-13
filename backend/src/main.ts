import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  createCorsOriginValidator,
  normalizeApiPrefix,
  parseCorsOrigins,
  parsePositiveInt,
} from './config/env.utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const apiPrefix = normalizeApiPrefix(configService.get<string>('API_PREFIX'));
  const allowedOrigins = parseCorsOrigins(
    configService.get<string>('CORS_ORIGIN'),
  );

  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  app.enableShutdownHooks();
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: createCorsOriginValidator(allowedOrigins),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Disposition'],
  });

  const config = new DocumentBuilder()
    .setTitle('WebApp2026 API')
    .setDescription('NestJS API for mobile/web clients')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const docsPath = apiPrefix ? `${apiPrefix}/docs` : 'docs';
  SwaggerModule.setup(docsPath, app, document);

  const port = parsePositiveInt(configService.get<string>('PORT'), 3000);
  await app.listen(port);
}
void bootstrap();
