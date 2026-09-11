import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { Roles } from '../auth/auth.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { AssignUserCategoryRoleDto } from './dto/assign-user-category-role.dto';
import { UserCategoryRoleResponseDto } from './dto/user-category-role-response.dto';
import { UserCategoryRolesService } from './user-category-roles.service';

@ApiTags('user-category-roles')
@Controller('user-category-roles')
export class UserCategoryRolesController {
  constructor(private readonly userCategoryRolesService: UserCategoryRolesService) {}

  @Roles(UserRole.ADMIN)
  @Post('assign')
  @ApiOperation({
    summary: 'Gán hoặc Cập nhật danh sách quyền cho User trên Category (Chỉ Admin)',
  })
  async assignCategoryRole(
    @Body() dto: AssignUserCategoryRoleDto,
  ): Promise<UserCategoryRoleResponseDto> {
    const role = await this.userCategoryRolesService.assignCategoryRole(dto);
    return UserCategoryRoleResponseDto.fromDocument(role);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Lấy danh sách các Category & Quyền hạn được gán cho 1 User',
  })
  async findByUserId(
    @Param('userId', ParseObjectIdPipe) userId: string,
  ): Promise<UserCategoryRoleResponseDto[]> {
    const roles = await this.userCategoryRolesService.findByUserId(userId);
    return UserCategoryRoleResponseDto.fromDocuments(roles);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Thu hồi quyền của User trên Category (xóa mềm - Chỉ Admin)' })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<UserCategoryRoleResponseDto> {
    const role = await this.userCategoryRolesService.remove(id);
    return UserCategoryRoleResponseDto.fromDocument(role);
  }
}
