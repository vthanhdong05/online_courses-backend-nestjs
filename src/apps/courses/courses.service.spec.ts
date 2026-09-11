import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CategoriesService } from '../categories/categories.service';
import { InstructorsService } from '../instructors/instructors.service';
import { CoursesService } from './courses.service';
import {
  COURSE_PUBLISH_VALIDATOR,
  ICoursePublishValidator,
} from './interfaces/course-publish-validator.interface';
import { Course, CourseStatus } from './schemas/course.schema';

describe('CoursesService - Status Transitions', () => {
  let service: CoursesService;
  let publishValidator: ICoursePublishValidator;

  const mockCourseId = new Types.ObjectId().toString();

  const createMockCourseDoc = (status: CourseStatus) => {
    const doc: any = {
      _id: new Types.ObjectId(mockCourseId),
      title: 'Test Course',
      price: 100,
      includedInVip: false,
      categoryId: new Types.ObjectId(),
      instructorId: new Types.ObjectId(),
      status,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
      populate: jest.fn().mockReturnThis(),
    };
    return doc;
  };

  let mockCourseModel: any;

  beforeEach(async () => {
    mockCourseModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      countDocuments: jest.fn(),
      softDeleteById: jest.fn(),
    };

    const mockCategoriesService = {
      assertExists: jest.fn().mockResolvedValue(true),
    };

    const mockInstructorsService = {
      assertExists: jest.fn().mockResolvedValue(true),
    };

    const mockPublishValidator = {
      validate: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getModelToken(Course.name),
          useValue: mockCourseModel,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
        {
          provide: InstructorsService,
          useValue: mockInstructorsService,
        },
        {
          provide: COURSE_PUBLISH_VALIDATOR,
          useValue: mockPublishValidator,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    publishValidator = module.get<ICoursePublishValidator>(COURSE_PUBLISH_VALIDATOR);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changeStatus transitions', () => {
    it('draft -> ready: pass', async () => {
      const mockCourse = createMockCourseDoc(CourseStatus.DRAFT);
      mockCourseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCourse),
        }),
      });

      const updated = await service.changeStatus(mockCourseId, {
        status: CourseStatus.READY,
      });

      expect(updated.status).toBe(CourseStatus.READY);
      expect(mockCourse.save).toHaveBeenCalled();
    });

    it('draft -> published (nhảy bước): reject', async () => {
      const mockCourse = createMockCourseDoc(CourseStatus.DRAFT);
      mockCourseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCourse),
        }),
      });

      await expect(
        service.changeStatus(mockCourseId, {
          status: CourseStatus.PUBLISHED,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockCourse.save).not.toHaveBeenCalled();
    });

    it('ready -> published khi validator throw: reject, status giữ nguyên', async () => {
      const mockCourse = createMockCourseDoc(CourseStatus.READY);
      mockCourseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCourse),
        }),
      });

      jest
        .spyOn(publishValidator, 'validate')
        .mockRejectedValueOnce(new BadRequestException('Course has invalid lessons'));

      await expect(
        service.changeStatus(mockCourseId, {
          status: CourseStatus.PUBLISHED,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockCourse.status).toBe(CourseStatus.READY);
      expect(mockCourse.save).not.toHaveBeenCalled();
    });

    it('ready -> published khi validator pass: đổi thành published', async () => {
      const mockCourse = createMockCourseDoc(CourseStatus.READY);
      mockCourseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCourse),
        }),
      });

      jest.spyOn(publishValidator, 'validate').mockResolvedValueOnce(undefined);

      const updated = await service.changeStatus(mockCourseId, {
        status: CourseStatus.PUBLISHED,
      });

      expect(publishValidator.validate).toHaveBeenCalledWith(mockCourseId);
      expect(updated.status).toBe(CourseStatus.PUBLISHED);
      expect(mockCourse.save).toHaveBeenCalled();
    });

    it('published -> ready: pass', async () => {
      const mockCourse = createMockCourseDoc(CourseStatus.PUBLISHED);
      mockCourseModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCourse),
        }),
      });

      const updated = await service.changeStatus(mockCourseId, {
        status: CourseStatus.READY,
      });

      expect(updated.status).toBe(CourseStatus.READY);
      expect(mockCourse.save).toHaveBeenCalled();
    });
  });
});
