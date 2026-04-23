import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionBody = isHttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (typeof exceptionBody === 'string') {
      message = exceptionBody;
    } else if (
      exceptionBody &&
      typeof exceptionBody === 'object' &&
      'message' in exceptionBody
    ) {
      const rawMessage = (exceptionBody as { message?: unknown }).message;
      if (Array.isArray(rawMessage)) {
        errors = rawMessage.map(String);
        message = 'Validation failed';
      } else if (rawMessage) {
        message = String(rawMessage);
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors ? { errors } : {}),
    });
  }
}
