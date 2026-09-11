import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AccessService } from '../access/access.service';
import { CoursesService } from '../courses/courses.service';
import { ReviewsService } from './reviews.service';
import { Review } from './schemas/review.schema';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockStudentId = new Types.ObjectId().toString();
  const mockCourseId = new Types.ObjectId().toString();
  const mockStaffId = new Types.ObjectId().toString();
  const mockReviewId = new Types.ObjectId().toString();

  const mockCoursesService = {
    assertExists: jest.fn(),
  };

  const mockAccessService = {
    canAccessCourse: jest.fn(),
  };

  let storedReviews: any[] = [];

  function createMockReviewDoc(data: any) {
    const doc = {
      _id: data._id || new Types.ObjectId(mockReviewId),
      studentId: new Types.ObjectId(data.studentId || mockStudentId),
      courseId: new Types.ObjectId(data.courseId || mockCourseId),
      rating: data.rating || 5,
      comment: data.comment || 'Khóa học tuyệt vời!',
      replyComment: data.replyComment || null,
      repliedBy: data.repliedBy || null,
      repliedAt: data.repliedAt || null,
      deletedAt: data.deletedAt || null,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      toObject: jest.fn().mockImplementation(function (this: any) {
        return { ...this };
      }),
    };
    return doc;
  }

  const mockReviewModel = jest.fn().mockImplementation((dto) => {
    const newDoc = createMockReviewDoc(dto);
    storedReviews.push(newDoc);
    return newDoc;
  });

  (mockReviewModel as any).findOne = jest.fn().mockImplementation((query) => {
    const found = storedReviews.find(
      (r) =>
        r.studentId.toString() === query.studentId.toString() &&
        r.courseId.toString() === query.courseId.toString() &&
        !r.deletedAt,
    );
    return Promise.resolve(found || null);
  });

  (mockReviewModel as any).findById = jest.fn().mockImplementation((id) => {
    const found = storedReviews.find((r) => r._id.toString() === id.toString() && !r.deletedAt);
    return Promise.resolve(found || null);
  });

  (mockReviewModel as any).find = jest.fn().mockImplementation(() => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(storedReviews),
  }));

  (mockReviewModel as any).countDocuments = jest.fn().mockImplementation(() => {
    return Promise.resolve(storedReviews.length);
  });

  (mockReviewModel as any).aggregate = jest.fn().mockImplementation(() => {
    if (storedReviews.length === 0) return Promise.resolve([]);
    const sum = storedReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / storedReviews.length;
    return Promise.resolve([{ _id: null, avgRating: avg, count: storedReviews.length }]);
  });

  (mockReviewModel as any).softDeleteById = jest.fn().mockImplementation((id) => {
    const found = storedReviews.find((r) => r._id.toString() === id.toString());
    if (found) {
      found.deletedAt = new Date();
      return Promise.resolve(found);
    }
    return Promise.resolve(null);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    storedReviews = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getModelToken(Review.name),
          useValue: mockReviewModel,
        },
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
        {
          provide: AccessService,
          useValue: mockAccessService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('createOrUpdateReview', () => {
    it('throws ForbiddenException if student does NOT have valid course access', async () => {
      mockCoursesService.assertExists.mockResolvedValue(true);
      mockAccessService.canAccessCourse.mockResolvedValue(false);

      await expect(
        service.createOrUpdateReview(mockStudentId, mockCourseId, {
          rating: 5,
          comment: 'Rất hay!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates new review when student has valid access and no prior review', async () => {
      mockCoursesService.assertExists.mockResolvedValue(true);
      mockAccessService.canAccessCourse.mockResolvedValue(true);

      const review = await service.createOrUpdateReview(mockStudentId, mockCourseId, {
        rating: 5,
        comment: 'Khóa học tuyệt vời!',
      });

      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Khóa học tuyệt vời!');
      expect(storedReviews.length).toBe(1);
    });

    it('updates existing review when student submits review for the same course again', async () => {
      mockCoursesService.assertExists.mockResolvedValue(true);
      mockAccessService.canAccessCourse.mockResolvedValue(true);

      const existingDoc = createMockReviewDoc({
        studentId: mockStudentId,
        courseId: mockCourseId,
        rating: 3,
        comment: 'Bình thường',
      });
      storedReviews.push(existingDoc);

      const updated = await service.createOrUpdateReview(mockStudentId, mockCourseId, {
        rating: 5,
        comment: 'Cập nhật lại: Khóa học rất xuất sắc!',
      });

      expect(updated.rating).toBe(5);
      expect(updated.comment).toBe('Cập nhật lại: Khóa học rất xuất sắc!');
      expect(storedReviews.length).toBe(1);
    });
  });

  describe('replyToReview', () => {
    it('throws NotFoundException if review does not exist', async () => {
      await expect(
        service.replyToReview(mockCourseId, mockReviewId, mockStaffId, {
          comment: 'Cảm ơn bạn',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates replyComment, repliedBy, and repliedAt when staff replies', async () => {
      const existingDoc = createMockReviewDoc({
        _id: new Types.ObjectId(mockReviewId),
        studentId: mockStudentId,
        courseId: mockCourseId,
      });
      storedReviews.push(existingDoc);

      const replied = await service.replyToReview(mockCourseId, mockReviewId, mockStaffId, {
        comment: 'Cảm ơn nhận xét tích cực từ bạn!',
      });

      expect(replied.replyComment).toBe('Cảm ơn nhận xét tích cực từ bạn!');
      expect(replied.repliedBy?.toString()).toBe(mockStaffId);
      expect(replied.repliedAt).toBeDefined();
    });
  });

  describe('findByCourseId', () => {
    it('returns course average rating and total reviews count correctly', async () => {
      mockCoursesService.assertExists.mockResolvedValue(true);
      storedReviews.push(createMockReviewDoc({ rating: 5 }), createMockReviewDoc({ rating: 4 }));

      const summary = await service.findByCourseId(mockCourseId, { page: 1, limit: 10 });

      expect(summary.totalReviews).toBe(2);
      expect(summary.averageRating).toBe(4.5);
    });
  });

  describe('removeReview', () => {
    it('throws ForbiddenException if non-author student attempts to delete review', async () => {
      const existingDoc = createMockReviewDoc({
        _id: new Types.ObjectId(mockReviewId),
        studentId: mockStudentId,
        courseId: mockCourseId,
      });
      storedReviews.push(existingDoc);

      const otherStudentId = new Types.ObjectId().toString();

      await expect(
        service.removeReview(mockCourseId, mockReviewId, otherStudentId, 'student'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows author student or staff/admin to delete review', async () => {
      const existingDoc = createMockReviewDoc({
        _id: new Types.ObjectId(mockReviewId),
        studentId: mockStudentId,
        courseId: mockCourseId,
      });
      storedReviews.push(existingDoc);

      const deleted = await service.removeReview(
        mockCourseId,
        mockReviewId,
        mockStudentId,
        'student',
      );

      expect(deleted?.deletedAt).toBeDefined();
    });
  });
});
