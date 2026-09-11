import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';

// Bộ đánh chặn tự động: Ghi lại chi tiết dữ liệu mọi Request đến, Response đi và bắt lỗi của hệ thống.
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const { body, params, query } = req;
    const logContext = `${context.getClass().name} > ${context.getHandler().name}`;
    Logger.log({
      context: logContext,
      payload: { body, params, query },
    });

    return next.handle().pipe(
      map((value) => {
        Logger.log({ context: logContext, response: value });
        return value;
      }),
      catchError((err) => {
        Logger.error({
          context: logContext,
          message: err.message,
          stack: err.stack,
        });
        return throwError(() => err);
      }),
    );
  }
}
