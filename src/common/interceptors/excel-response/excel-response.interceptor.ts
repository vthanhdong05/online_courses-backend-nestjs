import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class ExcelResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse<Response>();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    const fileName = context.getClass().name.replace('Controller', '').toLowerCase();
    const currentDate = new Date().toISOString().slice(0, 10).replaceAll('-', '_'); // 2026_08_16

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}_${currentDate}.xlsx"`);

    return next.handle();
  }
}
