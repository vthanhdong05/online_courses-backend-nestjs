import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiUtilService } from '../utils/api-util/api-util.service';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private apiUtilService: ApiUtilService,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const exceptions = this.extractErrors(exception);

    const status = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = this.apiUtilService.formatResponse({
      errors: exceptions,
    });

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }

  private extractErrors(exception: any): any[] {
    if (Array.isArray(exception.response?.errors)) {
      return exception.response.errors.map((msg: string) => ({ message: msg }));
    }
    if (exception.response?.message) {
      const messages = Array.isArray(exception.response.message)
        ? exception.response.message
        : [exception.response.message];
      return messages.map((msg: string) => ({ message: msg }));
    }
    if (exception.message) {
      return [{ message: exception.message }];
    }
    if (exception.error?.message) {
      return [{ message: exception.error.message }];
    }
    return [{ message: 'Unknown error' }];
  }
}
