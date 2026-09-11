import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyReviewDto {
  @ApiProperty({
    description: 'Nội dung phản hồi của Staff / Instructor đối với bài đánh giá của Học viên',
    example: 'Cảm ơn bạn đã đồng hành cùng khóa học!',
  })
  @IsString({ message: 'Nội dung phản hồi phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung phản hồi không được để trống' })
  comment!: string;
}
