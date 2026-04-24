import { ConfigService } from '@nestjs/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ValidationError } from 'class-validator';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

function flattenValidationErrors(errors: ValidationError[]): {
  errors: string[];
  fieldErrors: Record<string, string[]>;
} {
  const messages: string[] = [];
  const fieldErrors: Record<string, string[]> = {};

  const walk = (e: ValidationError, path: string) => {
    const key = path ? `${path}.${e.property}` : e.property;
    if (e.constraints) {
      const vals = Object.values(e.constraints).map(String);
      messages.push(...vals);
      fieldErrors[key] = [...(fieldErrors[key] ?? []), ...vals];
    }
    if (e.children?.length) {
      for (const c of e.children) walk(c, key);
    }
  };

  for (const e of errors) walk(e, '');
  return { errors: messages, fieldErrors };
}

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim() ?? '';
  const isProd = process.env.NODE_ENV === 'production';

  if (!raw) {
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ];
  }

  if (raw === '*') {
    if (isProd) {
      console.warn(
        '[CORS] CORS_ORIGINS=* is not allowed in production. Set explicit origins.',
      );
    }
    return [];
  }

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = parseCorsOrigins();
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const { errors: msgs, fieldErrors } = flattenValidationErrors(
          errors as ValidationError[],
        );
        return new BadRequestException({
          message: 'errors.validationFailed',
          errors: msgs,
          fieldErrors,
        });
      },
    }),
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Estate Agency API')
      .setDescription('Agent, transaction and reporting endpoints')
      .setVersion('1.0.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3002;

  await app.listen(port);
}
void bootstrap();
