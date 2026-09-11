import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Lập trình Web' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Khóa học lập trình web từ cơ bản đến nâng cao', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
