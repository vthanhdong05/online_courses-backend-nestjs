import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { QuestionType } from '../schemas/assignment.schema';
import { Lesson } from '../schemas/lesson.schema';
import { LessonCoursePublishValidator } from './lesson-course-publish.validator';

describe('LessonCoursePublishValidator', () => {
  let validator: LessonCoursePublishValidator;

  const mockCourseId = new Types.ObjectId().toString();

  const mockLessonModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonCoursePublishValidator,
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
      ],
    }).compile();

    validator = module.get<LessonCoursePublishValidator>(LessonCoursePublishValidator);
  });

  it('từ chối xuất bản (throw BadRequestException) khi khóa học chưa có bài học (Lesson) nào', async () => {
    mockLessonModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(validator.validate(mockCourseId)).rejects.toThrow(BadRequestException);
  });

  it('từ chối xuất bản khi bài học thiếu videoUrl hoặc thiếu bài tập (Assignment)', async () => {
    const invalidLessons = [
      {
        _id: new Types.ObjectId(),
        title: 'Bài 1: Thiếu video',
        videoUrl: '', // Thiếu videoUrl
        assignment: {
          passingScore: 70,
          questions: [
            {
              type: QuestionType.MCQ,
              content: 'Q1',
              options: ['A', 'B'],
              correctAnswer: 'A',
            },
          ],
        },
      },
      {
        _id: new Types.ObjectId(),
        title: 'Bài 2: Thiếu bài tập',
        videoUrl: 'https://cdn.example.com/video2.mp4',
        assignment: null, // Thiếu assignment
      },
    ];

    mockLessonModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(invalidLessons),
      }),
    });

    await expect(validator.validate(mockCourseId)).rejects.toThrow(
      /Khóa học chưa đủ điều kiện xuất bản/,
    );
  });

  it('cho phép xuất bản (pass validation) khi tất cả các Bài học đều có videoUrl và bài tập hợp lệ', async () => {
    const validLessons = [
      {
        _id: new Types.ObjectId(),
        title: 'Bài 1: Chuẩn mực',
        videoUrl: 'https://cdn.example.com/video1.mp4',
        assignment: {
          passingScore: 70,
          questions: [
            {
              type: QuestionType.MCQ,
              content: 'NestJS dùng framework mặc định nào?',
              options: ['Express', 'Fastify'],
              correctAnswer: 'Express',
            },
          ],
        },
      },
    ];

    mockLessonModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(validLessons),
      }),
    });

    await expect(validator.validate(mockCourseId)).resolves.not.toThrow();
  });
});
