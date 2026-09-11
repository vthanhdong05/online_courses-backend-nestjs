import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { AssignUserCategoryRoleDto } from './dto/assign-user-category-role.dto';
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
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
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

  async assignCategoryRole(dto: AssignUserCategoryRoleDto): Promise<UserCategoryRoleDocument> {
    const { userId, categoryId, permissions } = dto;
    await this.usersService.findOne(userId);
    await this.categoriesService.assertExists(categoryId);

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

  async findByUserId(userId: string): Promise<UserCategoryRoleDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException(`Invalid User ID: ${userId}`);
    }
    return this.userCategoryRoleModel
      .find({
        userId: new Types.ObjectId(userId),
        status: UserCategoryRoleStatus.ACTIVE,
      })
      .populate('categoryId')
      .exec();
  }

  async remove(id: string): Promise<UserCategoryRoleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid ID: ${id}`);
    }
    const role = await this.userCategoryRoleModel.softDeleteById(id);
    if (!role) {
      throw new NotFoundException(`User category role with id ${id} not found`);
    }
    return role;
  }
}
