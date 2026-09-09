import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { UserCategoryRoleModel } from './schemas/user-category-role.schema';
import {
  UserCategoryRole,
  UserCategoryRoleDocument,
  UserCategoryRoleStatus,
} from './schemas/user-category-role.schema';

@Injectable()
export class UserCategoryRolesService {
  constructor(
    @InjectModel(UserCategoryRole.name)
    private readonly userCategoryRoleModel: UserCategoryRoleModel,
  ) {}

  async getUserCategoryPermissions(userId: string, categoryId?: string): Promise<string[]> {
    if (!userId || !Types.ObjectId.isValid(userId)) return [];

    const query: any = {
      userId: new Types.ObjectId(userId),
      status: UserCategoryRoleStatus.ACTIVE,
    };

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    const roles = await this.userCategoryRoleModel.find(query).exec();
    const permissionsSet = new Set<string>();

    for (const role of roles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        role.permissions.forEach((p) => permissionsSet.add(p));
      }
    }

    return Array.from(permissionsSet);
  }

  async assignCategoryRole(
    userId: string,
    categoryId: string,
    permissions: string[],
  ): Promise<UserCategoryRoleDocument> {
    return this.userCategoryRoleModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        categoryId: new Types.ObjectId(categoryId),
      },
      {
        $set: {
          permissions,
          status: UserCategoryRoleStatus.ACTIVE,
        },
      },
      { upsert: true, new: true },
    );
  }
}
