import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Điểm đánh giá sao từ 1 đến 5', example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt({ message: 'Rating phải là số nguyên' })
  @Min(1, { message: 'Rating tối thiểu là 1 sao' })
  @Max(5, { message: 'Rating tối đa là 5 sao' })
  rating!: number;

  @ApiProperty({
    description: 'Nội dung nhận xét / nhận xét chi tiết',
    example: 'Khóa học rất hay và bổ ích!',
  })
  @IsString({ message: 'Comment phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung nhận xét không được để trống' })
  comment!: string;
}
