import { ApiProperty } from '@nestjs/swagger';
import type { ReviewDocument } from '../schemas/review.schema';

export class StudentSummaryDto {
  @ApiProperty({ example: '6aa42ceb3b88678b7234e779' })
  id!: string;

  @ApiProperty({ example: 'Nguyen Trung' })
  fullName!: string;

  @ApiProperty({ example: 'nguyentrung@gmail.com' })
  email!: string;
}

export class StaffReplyDto {
  @ApiProperty({ example: 'Cảm ơn bạn đã đánh giá!' })
  comment!: string;

  @ApiProperty({ example: '6aa42ceb3b88678b7234e779', nullable: true })
  repliedBy?: string | null;

  @ApiProperty({ example: '2026-09-12T01:00:00.000Z', nullable: true })
  repliedAt?: Date | null;
}

export class ReviewResponseDto {
  @ApiProperty({ example: '6aa55ccb3b88678b7234e888' })
  id!: string;

  @ApiProperty({ example: '6aa42ceb3b88678b7234e779' })
  studentId!: string;

  @ApiProperty({ type: StudentSummaryDto, required: false })
  student?: StudentSummaryDto;

  @ApiProperty({ example: '6aa111cc6b702a119c0223b8' })
  courseId!: string;

  @ApiProperty({ example: 5 })
  rating!: number;

  @ApiProperty({ example: 'Khóa học tuyệt vời!' })
  comment!: string;

  @ApiProperty({ type: StaffReplyDto, nullable: true })
  staffReply?: StaffReplyDto | null;

  @ApiProperty({ example: '2026-09-12T01:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-12T01:00:00.000Z' })
  updatedAt!: Date;

  static fromDocument(doc: ReviewDocument): ReviewResponseDto {
    const obj = doc.toObject ? doc.toObject() : doc;
    const dto = new ReviewResponseDto();
    dto.id = (obj._id || doc._id).toString();

    if (obj.studentId && typeof obj.studentId === 'object' && 'fullName' in obj.studentId) {
      const studentObj = obj.studentId;
      dto.studentId = studentObj._id.toString();
      dto.student = {
        id: studentObj._id.toString(),
        fullName: studentObj.fullName || '',
        email: studentObj.email || '',
      };
    } else {
      dto.studentId = (obj.studentId || doc.studentId).toString();
    }

    dto.courseId = (obj.courseId || doc.courseId).toString();
    dto.rating = obj.rating;
    dto.comment = obj.comment;

    if (obj.replyComment) {
      dto.staffReply = {
        comment: obj.replyComment,
        repliedBy: obj.repliedBy ? obj.repliedBy.toString() : null,
        repliedAt: obj.repliedAt || null,
      };
    } else {
      dto.staffReply = null;
    }

    dto.createdAt = (doc as any).createdAt || obj.createdAt;
    dto.updatedAt = (doc as any).updatedAt || obj.updatedAt;

    return dto;
  }

  static fromDocuments(docs: ReviewDocument[]): ReviewResponseDto[] {
    return docs.map((doc) => ReviewResponseDto.fromDocument(doc));
  }
}
