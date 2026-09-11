import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { UserCategoryRole, UserCategoryRoleSchema } from './schemas/user-category-role.schema';
import { UserCategoryRolesController } from './user-category-roles.controller';
import { UserCategoryRolesService } from './user-category-roles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserCategoryRole.name, schema: UserCategoryRoleSchema }]),
    UsersModule,
    CategoriesModule,
  ],
  controllers: [UserCategoryRolesController],
  providers: [UserCategoryRolesService],
  exports: [UserCategoryRolesService, MongooseModule],
})
export class UserCategoryRolesModule {}
