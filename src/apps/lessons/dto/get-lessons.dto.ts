import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, Min } from 'class-validator';

export class GetLessonsQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Trang hiện tại' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Số lượng bài học trên mỗi trang' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Lọc bài học theo Course ID' })
  @IsOptional()
  @IsMongoId()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm bài học theo tiêu đề (title)' })
  @IsOptional()
  @IsString()
  search?: string;
}
