import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonDocument } from '../schemas/lesson.schema';
import { AssignmentAdminResponseDto, AssignmentPublicResponseDto } from './assignment-response.dto';

export class LessonResponseDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a1' })
  id: string;

  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a0' })
  courseId: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'Bài 1: Giới thiệu khóa học' })
  title: string;

  @ApiProperty({ example: 'https://cdn.example.com/videos/lesson1.mp4' })
  videoUrl: string;

  @ApiProperty({ example: true, description: 'Bài học đã có bài tập đính kèm hay chưa' })
  hasAssignment: boolean;

  @ApiPropertyOptional({
    type: AssignmentPublicResponseDto,
    description: 'Chi tiết bài tập (Public view cho học viên)',
  })
  assignment?: AssignmentPublicResponseDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDocument(doc: LessonDocument, isAdminView = false): LessonResponseDto {
    const raw = doc.toObject ? doc.toObject() : doc;
    const assignmentDto = isAdminView
      ? AssignmentAdminResponseDto.fromDocument(raw.assignment)
      : AssignmentPublicResponseDto.fromDocument(raw.assignment);

    return {
      id: raw._id.toString(),
      courseId: raw.courseId ? raw.courseId.toString() : '',
      order: raw.order,
      title: raw.title,
      videoUrl: raw.videoUrl,
      hasAssignment: Boolean(
        raw.assignment && raw.assignment.questions && raw.assignment.questions.length > 0,
      ),
      assignment: assignmentDto,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  static fromDocuments(docs: LessonDocument[], isAdminView = false): LessonResponseDto[] {
    return docs.map((doc) => LessonResponseDto.fromDocument(doc, isAdminView));
  }
}

export class PaginatedLessonsResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  items: LessonResponseDto[];

  @ApiProperty({ example: 25 })
  totalItems: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
