import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionDocument, SubscriptionStatus } from '../schemas/subscription.schema';

export class SubscriptionResponseDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a1' })
  id: string;

  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a0' })
  studentId: string;

  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a2' })
  planId: string;

  @ApiPropertyOptional({ example: '60d5ecb8b5c9c82b88b0e1a3' })
  orderId?: string | null;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @ApiProperty()
  createdAt: Date;

  static fromDocument(doc: SubscriptionDocument): SubscriptionResponseDto {
    const raw = doc.toObject ? doc.toObject() : doc;
    return {
      id: raw._id.toString(),
      studentId: raw.studentId
        ? raw.studentId._id
          ? raw.studentId._id.toString()
          : raw.studentId.toString()
        : '',
      planId: raw.planId
        ? raw.planId._id
          ? raw.planId._id.toString()
          : raw.planId.toString()
        : '',
      orderId: raw.orderId
        ? raw.orderId._id
          ? raw.orderId._id.toString()
          : raw.orderId.toString()
        : null,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status,
      createdAt: raw.createdAt,
    };
  }

  static fromDocuments(docs: SubscriptionDocument[]): SubscriptionResponseDto[] {
    return docs.map((doc) => SubscriptionResponseDto.fromDocument(doc));
  }
}
