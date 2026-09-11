import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/schemas/user.schema';

export const IS_SKIP_AUTH = 'isSkipAuth';
export const SkipAuth = () => SetMetadata(IS_SKIP_AUTH, true);

export const IS_SKIP_PERMISSION = 'isSkipPermission';
export const SkipPermission = () => SetMetadata(IS_SKIP_PERMISSION, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
