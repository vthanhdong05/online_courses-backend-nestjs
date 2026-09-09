import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Lập trình NestJS nâng cao' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Khóa học thiết kế microservices với NestJS', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 499000, minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  includedInVip?: boolean;

  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ example: '65f1a2b3c4d5e6f7a8b9c0d2' })
  @IsMongoId()
  @IsNotEmpty()
  instructorId!: string;
}
