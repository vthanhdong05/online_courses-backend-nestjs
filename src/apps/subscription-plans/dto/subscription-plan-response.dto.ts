import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlanDocument } from '../schemas/subscription-plan.schema';

export class SubscriptionPlanResponseDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a1' })
  id: string;

  @ApiProperty({ example: 'Gói VIP 1 Tháng' })
  name: string;

  @ApiProperty({ example: 30 })
  durationInDays: number;

  @ApiProperty({ example: 199000 })
  price: number;

  @ApiPropertyOptional({ example: 'Truy cập toàn bộ khóa học VIP trong 30 ngày' })
  description?: string;

  @ApiProperty()
  createdAt: Date;

  static fromDocument(doc: SubscriptionPlanDocument): SubscriptionPlanResponseDto {
    const raw = doc.toObject ? doc.toObject() : doc;
    return {
      id: raw._id.toString(),
      name: raw.name,
      durationInDays: raw.durationInDays,
      price: raw.price,
      description: raw.description,
      createdAt: raw.createdAt,
    };
  }

  static fromDocuments(docs: SubscriptionPlanDocument[]): SubscriptionPlanResponseDto[] {
    return docs.map((doc) => SubscriptionPlanResponseDto.fromDocument(doc));
  }
}
