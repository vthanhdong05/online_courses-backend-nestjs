import { ApiProperty } from '@nestjs/swagger';
import { ReviewResponseDto } from './review-response.dto';

export class CourseReviewsSummaryDto {
  @ApiProperty({ example: '6aa111cc6b702a119c0223b8' })
  courseId!: string;

  @ApiProperty({ example: 4.8, description: 'Điểm đánh giá trung bình (1-5 sao)' })
  averageRating!: number;

  @ApiProperty({ example: 25, description: 'Tổng số lượt đánh giá' })
  totalReviews!: number;

  @ApiProperty({ type: [ReviewResponseDto] })
  items!: ReviewResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}
