import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderDocument, OrderStatus, OrderType } from '../schemas/order.schema';

export class OrderResponseDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a1' })
  id: string;

  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a0' })
  studentId: string;

  @ApiProperty({ enum: OrderType, example: OrderType.COURSE })
  type: OrderType;

  @ApiPropertyOptional({ example: '60d5ecb8b5c9c82b88b0e1a2' })
  courseId?: string | null;

  @ApiProperty({ example: 499000, description: 'Số tiền đơn hàng (VNĐ)' })
  amount: number;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiPropertyOptional({ example: null })
  paidAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  static fromDocument(doc: OrderDocument): OrderResponseDto {
    const raw = doc.toObject ? doc.toObject() : doc;
    return {
      id: raw._id.toString(),
      studentId: raw.studentId
        ? raw.studentId._id
          ? raw.studentId._id.toString()
          : raw.studentId.toString()
        : '',
      type: raw.type,
      courseId: raw.courseId
        ? raw.courseId._id
          ? raw.courseId._id.toString()
          : raw.courseId.toString()
        : null,
      amount: raw.amount,
      status: raw.status,
      paidAt: raw.paidAt,
      createdAt: raw.createdAt,
    };
  }

  static fromDocuments(docs: OrderDocument[]): OrderResponseDto[] {
    return docs.map((doc) => OrderResponseDto.fromDocument(doc));
  }
}
