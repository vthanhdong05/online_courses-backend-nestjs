import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { UserRole, UserStatus } from '../schemas/user.schema';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export class GetUsersQueryDto {
  @ApiPropertyOptional({ default: DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({ default: DEFAULT_LIMIT, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = DEFAULT_LIMIT;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  // Search theo email chính xác/1 phần — dùng $regex trong service, không phải validate email chuẩn
  @ApiPropertyOptional({ example: 'staff.english@' })
  @IsOptional()
  email?: string;
}

export { DEFAULT_LIMIT, DEFAULT_PAGE };
