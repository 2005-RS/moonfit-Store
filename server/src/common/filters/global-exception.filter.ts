import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorResponseBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const normalizedResponse = this.normalizeExceptionResponse(
      status,
      exceptionResponse,
      exception,
    );

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: normalizedResponse.error,
      message: normalizedResponse.message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeExceptionResponse(
    status: number,
    response: ErrorResponseBody | string | null,
    exception: unknown,
  ) {
    if (typeof response === 'string') {
      return {
        error: this.getDefaultErrorLabel(status),
        message: response,
      };
    }

    if (response && typeof response === 'object') {
      return {
        error: response.error ?? this.getDefaultErrorLabel(status),
        message: response.message ?? this.getDefaultMessage(status),
      };
    }

    return {
      error: this.getDefaultErrorLabel(status),
      message:
        exception instanceof Error
          ? exception.message
          : this.getDefaultMessage(status),
    };
  }

  private getDefaultErrorLabel(status: number) {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      default:
        return 'Internal Server Error';
    }
  }

  private getDefaultMessage(status: number) {
    if (status === 500) {
      return 'An unexpected error occurred.';
    }

    return 'Request failed.';
  }
}
