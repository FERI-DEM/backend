import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AxiosError } from 'axios';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
    }

    if (exception instanceof AxiosError) {
      httpStatus = exception.response?.status;
    }

    let errorMessage;

    if (exception instanceof AxiosError) {
      errorMessage = exception.response.data.description;
    } else {
      errorMessage = (exception as Error).message || 'Internal server error';
    }

    const responseBody = {
      statusCode: httpStatus,
      error: errorMessage,
      method: ctx.getRequest().method,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
