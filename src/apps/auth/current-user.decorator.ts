import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;

    if (data) {
      // Hỗ trợ lấy theo tên field cụ thể hoặc tự động fallback giữa userId / sub / id
      if (user[data] !== undefined) {
        return user[data];
      }
      if (data === 'sub' || data === 'id' || data === 'userId') {
        return user.userId ?? user.sub ?? user.id ?? user._id;
      }
      return undefined;
    }

    return user;
  },
);
