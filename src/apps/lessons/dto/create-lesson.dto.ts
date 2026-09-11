import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUrl, Min } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Bài 1: Giới thiệu khóa học' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'https://cdn.example.com/videos/lesson1.mp4' })
  @IsNotEmpty()
  @IsUrl({}, { message: 'videoUrl phải là đường dẫn URL hợp lệ' })
  videoUrl: string;

  @ApiProperty({ example: 1, description: 'Số thứ tự hiển thị của bài học' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  order: number;
}
