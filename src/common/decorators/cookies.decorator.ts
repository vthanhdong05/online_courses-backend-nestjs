import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator((key: string | undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const cookies = req.cookies;
  return key ? cookies?.[key] : cookies;
});
