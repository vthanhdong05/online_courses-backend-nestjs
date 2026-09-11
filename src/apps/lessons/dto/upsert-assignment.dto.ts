import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '../schemas/assignment.schema';

export class QuestionDto {
  @ApiProperty({ enum: QuestionType, example: QuestionType.MCQ })
  @IsNotEmpty()
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ example: 'NestJS sử dụng framework HTTP mặc định nào?' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Express', 'Fastify', 'Koa', 'Hapi'],
    description: 'Danh sách các lựa chọn (chỉ bắt buộc cho câu hỏi MCQ)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({
    example: 'Express',
    description: 'Đáp án đúng (chỉ lưu trữ & dùng chấm điểm nội bộ)',
  })
  @IsNotEmpty()
  @IsString()
  correctAnswer: string;
}

export class UpsertAssignmentDto {
  @ApiPropertyOptional({ example: 70, default: 70, description: 'Điểm phần trăm đạt (0 - 100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore?: number = 70;

  @ApiProperty({ type: [QuestionDto], description: 'Danh sách câu hỏi của bài tập' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
