import { ApiProperty } from '@nestjs/swagger';

export class QuestionGradingDetailDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a2' })
  questionId: string;

  @ApiProperty({ example: true })
  isCorrect: boolean;
}

export class GradingResultDto {
  @ApiProperty({ example: 4 })
  totalQuestions: number;

  @ApiProperty({ example: 3 })
  correctCount: number;

  @ApiProperty({ example: 75 })
  score: number;

  @ApiProperty({ example: 70 })
  passingScore: number;

  @ApiProperty({ example: true })
  passed: boolean;

  @ApiProperty({ type: [QuestionGradingDetailDto] })
  details: QuestionGradingDetailDto[];
}
