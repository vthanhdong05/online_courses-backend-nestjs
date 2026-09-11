import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Types } from 'mongoose';
import { AccessService } from '../access/access.service';
import { CoursesService } from '../courses/courses.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import type { ReviewModel } from './schemas/review.schema';
import { Review, ReviewDocument } from './schemas/review.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: ReviewModel,
    @Inject(forwardRef(() => CoursesService))
    private readonly coursesService: CoursesService,
    @Inject(forwardRef(() => AccessService))
    private readonly accessService: AccessService,
  ) {}

  async createOrUpdateReview(
    studentId: string,
    courseId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    await this.coursesService.assertExists(courseId);

    const canAccess = await this.accessService.canAccessCourse(studentId, courseId);
    if (!canAccess) {
      throw new ForbiddenException(
        'Bạn chỉ có thể đánh giá các khóa học mà bạn đã sở hữu hoặc có gói VIP active',
      );
    }

    let review = await this.reviewModel.findOne({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    if (!review) {
      review = new this.reviewModel({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
      });
    }

    review.rating = dto.rating;
    review.comment = dto.comment;

    return review.save();
  }

  async replyToReview(
    courseId: string,
    reviewId: string,
    staffId: string,
    dto: ReplyReviewDto,
  ): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(reviewId)) {
      throw new NotFoundException('ID khóa học hoặc ID đánh giá không hợp lệ');
    }

    const review = await this.reviewModel.findById(reviewId);
    if (!review || review.courseId.toString() !== courseId) {
      throw new NotFoundException(`Review ${reviewId} không tồn tại trong khóa học ${courseId}`);
    }

    review.replyComment = dto.comment;
    review.repliedBy = new Types.ObjectId(staffId);
    review.repliedAt = new Date();

    return review.save();
  }

  async findByCourseId(
    courseId: string,
    query: GetReviewsQueryDto,
  ): Promise<{
    courseId: string;
    averageRating: number;
    totalReviews: number;
    items: ReviewDocument[];
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.coursesService.assertExists(courseId);

    const { page = 1, limit = 10, rating } = query;
    const filter: QueryFilter<ReviewDocument> = {
      courseId: new Types.ObjectId(courseId),
    };

    if (rating) {
      filter.rating = rating;
    }

    const skip = (page - 1) * limit;

    const [aggResult, items, totalFiltered] = await Promise.all([
      this.reviewModel.aggregate([
        { $match: { courseId: new Types.ObjectId(courseId) } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      this.reviewModel
        .find(filter)
        .populate('studentId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);

    const totalReviews = aggResult[0]?.count || 0;
    const rawAvg = aggResult[0]?.avgRating || 0;
    const averageRating = rawAvg ? Math.round(rawAvg * 10) / 10 : 0;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    return {
      courseId,
      averageRating,
      totalReviews,
      items,
      page,
      limit,
      totalPages,
    };
  }

  async findMyReviews(studentId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('courseId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async removeReview(
    courseId: string,
    reviewId: string,
    userId: string,
    userRole: string,
  ): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(courseId) || !Types.ObjectId.isValid(reviewId)) {
      throw new NotFoundException('ID khóa học hoặc ID đánh giá không hợp lệ');
    }

    const review = await this.reviewModel.findById(reviewId);
    if (!review || review.courseId.toString() !== courseId) {
      throw new NotFoundException(`Review ${reviewId} không tồn tại trong khóa học ${courseId}`);
    }

    const isAuthor = review.studentId.toString() === userId;
    const isStaffOrAdmin = userRole === 'admin' || userRole === 'staff';

    if (!isAuthor && !isStaffOrAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bài đánh giá này');
    }

    const deleted = await this.reviewModel.softDeleteById(reviewId);
    if (!deleted) {
      throw new NotFoundException(`Review ${reviewId} không tìm thấy`);
    }
    return deleted;
  }
}
