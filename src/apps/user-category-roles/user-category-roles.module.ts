import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserCategoryRole, UserCategoryRoleSchema } from './schemas/user-category-role.schema';
import { UserCategoryRolesService } from './user-category-roles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserCategoryRole.name, schema: UserCategoryRoleSchema }]),
  ],
  providers: [UserCategoryRolesService],
  exports: [UserCategoryRolesService, MongooseModule],
})
export class UserCategoryRolesModule {}
