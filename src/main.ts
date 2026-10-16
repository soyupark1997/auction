import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppException } from './common/errors/app.exception.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (errors) =>
        new AppException(
          400,
          'VALIDATION_FAILED',
          '입력값이 올바르지 않습니다',
          errors.map((e) => ({
            field: e.property,
            messages: Object.values(e.constraints ?? {}),
          })),
        ),
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
