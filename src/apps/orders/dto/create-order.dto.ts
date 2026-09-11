import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional({
    example: '60d5ecb8b5c9c82b88b0e1a0',
    description: 'ID của Khóa học muốn mua lẻ',
  })
  @IsOptional()
  @IsMongoId({ message: 'courseId phải là Mongo ObjectId hợp lệ' })
  courseId?: string;

  @ApiPropertyOptional({
    example: '60d5ecb8b5c9c82b88b0e1a2',
    description: 'ID của Gói VIP muốn đăng ký',
  })
  @IsOptional()
  @IsMongoId({ message: 'subscriptionPlanId phải là Mongo ObjectId hợp lệ' })
  subscriptionPlanId?: string;
}
