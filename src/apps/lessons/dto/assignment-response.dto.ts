import { ApiProperty } from '@nestjs/swagger';
import { Assignment, Question, QuestionType } from '../schemas/assignment.schema';

export class PublicQuestionResponseDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a2' })
  id: string;

  @ApiProperty({ enum: QuestionType, example: QuestionType.MCQ })
  type: QuestionType;

  @ApiProperty({ example: 'NestJS sử dụng framework HTTP mặc định nào?' })
  content: string;

  @ApiProperty({ type: [String], required: false, example: ['Express', 'Fastify', 'Koa', 'Hapi'] })
  options?: string[];
}

export class AssignmentPublicResponseDto {
  @ApiProperty({ example: 70 })
  passingScore: number;

  @ApiProperty({ type: [PublicQuestionResponseDto] })
  questions: PublicQuestionResponseDto[];

  static fromDocument(
    assignment: Assignment | null | undefined,
  ): AssignmentPublicResponseDto | null {
    if (!assignment) return null;
    return {
      passingScore: assignment.passingScore ?? 70,
      questions: (assignment.questions || []).map((q: Question) => ({
        id: q._id ? q._id.toString() : '',
        type: q.type,
        content: q.content,
        options: q.options,
      })),
    };
  }
}

export class AdminQuestionResponseDto extends PublicQuestionResponseDto {
  @ApiProperty({ example: 'Express' })
  correctAnswer: string;
}

export class AssignmentAdminResponseDto {
  @ApiProperty({ example: 70 })
  passingScore: number;

  @ApiProperty({ type: [AdminQuestionResponseDto] })
  questions: AdminQuestionResponseDto[];

  static fromDocument(
    assignment: Assignment | null | undefined,
  ): AssignmentAdminResponseDto | null {
    if (!assignment) return null;
    return {
      passingScore: assignment.passingScore ?? 70,
      questions: (assignment.questions || []).map((q: Question) => ({
        id: q._id ? q._id.toString() : '',
        type: q.type,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),
    };
  }
}
