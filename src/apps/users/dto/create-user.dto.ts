import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, Matches, MinLength } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'staff.english@eduflow.dev' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ example: 'Str0ngP@ss', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  fullName!: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @Matches(/^[0-9]{10,11}$/, { message: 'Invalid phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.eduflow.dev/avatars/a.png' })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF })
  @IsEnum(UserRole, { message: 'role must be one of admin, staff, student' })
  role!: UserRole;
}
