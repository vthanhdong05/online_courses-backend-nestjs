import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class AnswerItemDto {
  @ApiProperty({ example: '60d5ecb8b5c9c82b88b0e1a2', description: 'ID của câu hỏi' })
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @ApiProperty({ example: 'Express', description: 'Câu trả lời của học viên' })
  @IsNotEmpty()
  @IsString()
  answer: string;
}

export class SubmitAssignmentDto {
  @ApiProperty({ type: [AnswerItemDto], description: 'Danh sách các câu trả lời' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
