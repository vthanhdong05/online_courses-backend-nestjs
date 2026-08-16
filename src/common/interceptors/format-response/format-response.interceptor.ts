import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ApiUtilService } from '../../utils/api-util/api-util.service';

// Chuẩn hoá mọi response thành công về cùng 1 format với CatchEverythingFilter:
// { errors: null, data, message }. Nếu không có interceptor này, response thành công
// và response lỗi sẽ có 2 shape khác nhau, gây khó khăn cho FE khi xử lý chung 1 chỗ.
@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  constructor(private apiUtilService: ApiUtilService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) =>
        this.apiUtilService.formatResponse({
          data,
        }),
      ),
    );
  }
}
