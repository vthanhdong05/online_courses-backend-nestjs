import { ApiProperty } from '@nestjs/swagger';

export class LessonProgressDetailDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a1' })
  lessonId: string;

  @ApiProperty({ example: 'Bài 1: Tổng quan NestJS' })
  lessonTitle: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: true })
  videoCompleted: boolean;

  @ApiProperty({ example: true })
  hasAssignment: boolean;

  @ApiProperty({ example: true })
  assignmentPassed: boolean;

  @ApiProperty({ example: 85, required: false })
  score?: number | null;

  @ApiProperty({ example: true })
  isCompleted: boolean;
}

export class CourseProgressResponseDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a0' })
  courseId: string;

  @ApiProperty({ example: 10, description: 'Tổng số bài học trong khóa học' })
  totalLessons: number;

  @ApiProperty({ example: 10, description: 'Số bài học học viên đã hoàn thành' })
  completedLessons: number;

  @ApiProperty({ example: 100, description: 'Phần trăm hoàn thành khóa học (0 - 100%)' })
  progressPercentage: number;

  @ApiProperty({ example: true, description: 'Trạng thái hoàn thành 100% khóa học' })
  isCourseCompleted: boolean;

  @ApiProperty({ type: [LessonProgressDetailDto] })
  lessonsProgress: LessonProgressDetailDto[];
}
