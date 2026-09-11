import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a0', description: 'ID của Khóa học muốn mua' })
  @IsNotEmpty()
  @IsMongoId({ message: 'courseId phải là Mongo ObjectId hợp lệ' })
  courseId: string;
}
