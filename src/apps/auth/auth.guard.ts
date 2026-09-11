import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../users/schemas/user.schema';
import { IS_SKIP_AUTH, ROLES_KEY } from './auth.decorator';
import { TokenKeys } from './consts/jwt.const';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isSkipAuth = this.reflector.getAllAndOverride<boolean>(IS_SKIP_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isSkipAuth) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const payload = await this.authService.verifyToken(token);
      const { iat: _iat, exp: _exp, ...userPayload } = payload;
      req['user'] = userPayload;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid or expired token');
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length) {
      const user = req['user'] as any;
      const hasRole = requiredRoles.includes(user?.role);
      if (!hasRole) {
        throw new ForbiddenException('Access denied: insufficient permissions');
      }
    }

    return true;
  }

  private extractToken(req: Request): string | undefined {
    const [type, bearerToken] = req.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && bearerToken) return bearerToken;
    const cookieToken = req.cookies?.[TokenKeys.ACCESS_TOKEN_KEY];
    return cookieToken || undefined;
  }
}
