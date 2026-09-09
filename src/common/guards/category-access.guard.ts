import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_SKIP_AUTH, IS_SKIP_PERMISSION, PERMISSIONS_KEY } from '../../apps/auth/auth.decorator';
import { UserCategoryRolesService } from '../../apps/user-category-roles/user-category-roles.service';
import { UserRole } from '../../apps/users/schemas/user.schema';
import { UsersService } from '../../apps/users/users.service';

@Injectable()
export class CategoryAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly userCategoryRolesService: UserCategoryRolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isSkipAuth = this.reflector.getAllAndOverride<boolean>(IS_SKIP_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isSkipAuth) return true;

    const isSkipPermission = this.reflector.getAllAndOverride<boolean>(IS_SKIP_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isSkipPermission) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req['user'] as any;
    if (!user || !user.userId) return false;

    // Admin có toàn quyền hệ thống (SuperAdmin bypass)
    if (user.role === UserRole.ADMIN) return true;
    const isSuperAdmin = await this.usersService.isSuperAdmin(user.userId);
    if (isSuperAdmin) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const categoryId =
      req.params?.categoryId ||
      req.params?.id ||
      (req.query?.categoryId as string) ||
      req.body?.categoryId;

    const userPermissions = await this.userCategoryRolesService.getUserCategoryPermissions(
      user.userId,
      categoryId,
    );

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Access denied: insufficient category permissions');
    }

    return true;
  }
}
