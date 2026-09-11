import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';
import { CourseStatus } from '../schemas/course.schema';

export class GetCoursesQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsMongoId()
  @IsOptional()
  instructorId?: string;

  @ApiProperty({ required: false, enum: CourseStatus })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;

  @ApiProperty({ required: false, description: 'Tìm kiếm theo tên khóa học' })
  @IsString()
  @IsOptional()
  search?: string;
}
