import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessType, EnrollmentDocument } from '../schemas/enrollment.schema';

export class EnrollmentResponseDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a1' })
  id: string;

  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a0' })
  studentId: string;

  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a2' })
  courseId: string;

  @ApiProperty({ enum: AccessType, example: AccessType.PURCHASED })
  accessType: AccessType;

  @ApiPropertyOptional({ example: '60d5ecb8b5c9c82b88b0e1a3' })
  orderId?: string | null;

  @ApiProperty()
  enrolledAt: Date;

  @ApiProperty()
  createdAt: Date;

  static fromDocument(doc: EnrollmentDocument): EnrollmentResponseDto {
    const raw = doc.toObject ? doc.toObject() : doc;
    return {
      id: raw._id.toString(),
      studentId: raw.studentId
        ? raw.studentId._id
          ? raw.studentId._id.toString()
          : raw.studentId.toString()
        : '',
      courseId: raw.courseId
        ? raw.courseId._id
          ? raw.courseId._id.toString()
          : raw.courseId.toString()
        : '',
      accessType: raw.accessType,
      orderId: raw.orderId
        ? raw.orderId._id
          ? raw.orderId._id.toString()
          : raw.orderId.toString()
        : null,
      enrolledAt: raw.enrolledAt,
      createdAt: raw.createdAt,
    };
  }

  static fromDocuments(docs: EnrollmentDocument[]): EnrollmentResponseDto[] {
    return docs.map((doc) => EnrollmentResponseDto.fromDocument(doc));
  }
}
