import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AppException } from '../errors/app.exception.js';

type ResponseLike = {
  status(code: number): { json(body: unknown): void };
};

function codeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_FAILED';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    default:
      return 'HTTP_ERROR';
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<ResponseLike>();

    if (exception instanceof AppException) {
      res.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      res
        .status(status)
        .json({ code: codeFromStatus(status), message: exception.message });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    res
      .status(500)
      .json({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' });
  }
}
