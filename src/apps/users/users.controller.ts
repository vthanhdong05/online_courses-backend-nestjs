import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExcelResponseInterceptor } from 'src/common/interceptors/excel-response/excel-response.interceptor';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import type { File } from '../../common/utils/excel-util/dto/excel-util.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { ImportUsersResultDto } from './dto/import-users-result.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Admin tạo tài khoản Admin/Staff (Student tự đăng ký ở /auth/sign-up)' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(dto);
    return UserResponseDto.fromDocument(user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách user, có phân trang + filter role/status/email' })
  async findAll(@Query() query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    const { items, totalItems, totalPages } = await this.usersService.findAll(query);
    return {
      items: UserResponseDto.fromDocuments(items),
      totalItems,
      totalPages,
      page: query.page,
      limit: query.limit,
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất danh sách user ra file Excel theo filter role/status/email' })
  @UseInterceptors(ExcelResponseInterceptor)
  async exportUsers(@Query() query: GetUsersQueryDto, @Res() res: Response): Promise<void> {
    const workbook = await this.usersService.exportUsers(query);
    await workbook.xlsx.write(res);
    res.end();
  }

  @Post('import')
  @ApiOperation({
    summary:
      'Import nhiều user cùng lúc từ file Excel (cột: email, password, fullName, phone, role)',
  })
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: File): Promise<ImportUsersResultDto> {
    return this.usersService.importUsers(file);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Khôi phục user đã bị soft delete' })
  async restore(@Param('id', ParseObjectIdPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.restore(id);
    return UserResponseDto.fromDocument(user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(id);
    return UserResponseDto.fromDocument(user);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(id, dto);
    return UserResponseDto.fromDocument(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete (đặt deletedAt), không xoá vật lý' })
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<UserResponseDto> {
    const user = await this.usersService.remove(id);
    return UserResponseDto.fromDocument(user);
  }
}
