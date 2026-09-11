import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { Roles } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CourseReviewsSummaryDto } from './dto/course-reviews-summary.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller(['reviews', 'courses/:courseId/reviews'])
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({
    summary: 'Viết hoặc cập nhật bài đánh giá cho khóa học (Học viên đã sở hữu / có VIP)',
  })
  async createOrUpdate(
    @CurrentUser('userId') studentId: string,
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.createOrUpdateReview(studentId, courseId, dto);
    return ReviewResponseDto.fromDocument(review);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài đánh giá & Điểm trung bình của Khóa học' })
  async findByCourseId(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Query() query: GetReviewsQueryDto,
  ): Promise<CourseReviewsSummaryDto> {
    const result = await this.reviewsService.findByCourseId(courseId, query);
    return {
      courseId: result.courseId,
      averageRating: result.averageRating,
      totalReviews: result.totalReviews,
      items: ReviewResponseDto.fromDocuments(result.items),
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách các bài đánh giá do chính Học viên đã viết' })
  async findMyReviews(@CurrentUser('userId') studentId: string): Promise<ReviewResponseDto[]> {
    const reviews = await this.reviewsService.findMyReviews(studentId);
    return ReviewResponseDto.fromDocuments(reviews);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':reviewId/reply')
  @ApiOperation({ summary: 'Staff / Instructor phản hồi bài đánh giá của học viên' })
  async replyToReview(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('reviewId', ParseObjectIdPipe) reviewId: string,
    @CurrentUser('userId') staffId: string,
    @Body() dto: ReplyReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.reviewsService.replyToReview(courseId, reviewId, staffId, dto);
    return ReviewResponseDto.fromDocument(review);
  }

  @Delete(':reviewId')
  @ApiOperation({ summary: 'Xóa bài đánh giá (Chính tác giả hoặc Admin/Staff)' })
  async removeReview(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('reviewId', ParseObjectIdPipe) reviewId: string,
    @CurrentUser() user: any,
  ): Promise<ReviewResponseDto> {
    const deleted = await this.reviewsService.removeReview(
      courseId,
      reviewId,
      user.userId,
      user.role,
    );
    return ReviewResponseDto.fromDocument(deleted);
  }
}
