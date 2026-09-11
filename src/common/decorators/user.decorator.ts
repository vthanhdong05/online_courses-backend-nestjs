import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../apps/users/schemas/user.schema';

export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions?: string[];
  [key: string]: any;
}

export const User = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as UserPayload;
    return data ? user?.[data] : user;
  },
);
