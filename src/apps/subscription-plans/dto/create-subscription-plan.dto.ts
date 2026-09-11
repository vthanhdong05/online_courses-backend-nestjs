import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Gói VIP 1 Tháng' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 30, description: 'Thời hạn gói cước tính theo ngày' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationInDays: number;

  @ApiProperty({ example: 199000, description: 'Giá tiền gói cước (VNĐ)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'Truy cập toàn bộ khóa học VIP trong 30 ngày' })
  @IsOptional()
  @IsString()
  description?: string;
}
