import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CoursesService } from '../courses/courses.service';
import { LessonsService } from './lessons.service';
import { Lesson } from './schemas/lesson.schema';
import { QuestionType } from './schemas/assignment.schema';

describe('LessonsService - Grading Logic & CRUD', () => {
  let service: LessonsService;

  const mockCourseId = new Types.ObjectId().toString();
  const mockLessonId = new Types.ObjectId().toString();

  const mockLessonDoc: any = {
    _id: new Types.ObjectId(mockLessonId),
    courseId: new Types.ObjectId(mockCourseId),
    title: 'Bài 1: Tổng quan NestJS',
    videoUrl: 'https://cdn.example.com/video1.mp4',
    order: 1,
    assignment: null,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
    toObject: jest.fn().mockImplementation(function () {
      return { ...this };
    }),
  };

  const mockLessonModel = {
    find: jest.fn(),
    findById: jest.fn(),
    softDeleteById: jest.fn(),
  };

  const mockCoursesService = {
    assertExists: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        {
          provide: getModelToken(Lesson.name),
          useValue: mockLessonModel,
        },
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  describe('normalizeAnswer', () => {
    it('chuẩn hóa chuỗi bằng cách trim khoảng trắng thừa và đưa về chữ thường', () => {
      expect(service.normalizeAnswer('  App  ')).toBe('app');
      expect(service.normalizeAnswer('APP')).toBe('app');
      expect(service.normalizeAnswer('app')).toBe('app');
      expect(service.normalizeAnswer(null)).toBe('');
      expect(service.normalizeAnswer(undefined)).toBe('');
    });
  });

  describe('gradeAssignment', () => {
    const q1Id = new Types.ObjectId().toString();
    const q2Id = new Types.ObjectId().toString();
    const q3Id = new Types.ObjectId().toString();
    const q4Id = new Types.ObjectId().toString();

    const assignmentData = {
      passingScore: 70,
      questions: [
        {
          _id: new Types.ObjectId(q1Id),
          type: QuestionType.MCQ,
          content: 'NestJS dùng framework nào?',
          options: ['Express', 'Fastify', 'Koa'],
          correctAnswer: 'Express',
        },
        {
          _id: new Types.ObjectId(q2Id),
          type: QuestionType.FILL_BLANK,
          content: 'Điền tên CLI:',
          correctAnswer: 'App',
        },
        {
          _id: new Types.ObjectId(q3Id),
          type: QuestionType.MCQ,
          content: 'TypeScript là superset của?',
          options: ['JavaScript', 'Python', 'Java'],
          correctAnswer: 'JavaScript',
        },
        {
          _id: new Types.ObjectId(q4Id),
          type: QuestionType.FILL_BLANK,
          content: 'Điền từ khóa định nghĩa provider:',
          correctAnswer: 'Injectable',
        },
      ],
    };

    it('báo lỗi BadRequestException nếu bài học chưa có bài tập đính kèm', async () => {
      mockLessonModel.findById.mockResolvedValue({
        ...mockLessonDoc,
        assignment: null,
      });

      await expect(
        service.gradeAssignment(mockCourseId, mockLessonId, { answers: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('chấm đúng MCQ (khớp chính xác) và Fill_Blank (trim + ignore case: "App" vs "app" vs " APP ")', async () => {
      mockLessonModel.findById.mockResolvedValue({
        ...mockLessonDoc,
        assignment: assignmentData,
      });

      const submission = {
        answers: [
          { questionId: q1Id, answer: 'Express' }, // MCQ đúng
          { questionId: q2Id, answer: '  app  ' }, // Fill blank đúng (khác case + dư space)
          { questionId: q3Id, answer: 'JavaScript' }, // MCQ đúng
          { questionId: q4Id, answer: '  APP  ' }, // Fill blank sai đáp án (đáp án đúng là Injectable)
        ],
      };

      const result = await service.gradeAssignment(mockCourseId, mockLessonId, submission);

      expect(result.totalQuestions).toBe(4);
      expect(result.correctCount).toBe(3);
      expect(result.score).toBe(75); // 3/4 = 75%
      expect(result.passingScore).toBe(70);
      expect(result.passed).toBe(true); // 75% >= 70% -> passed
    });

    it('fill_blank gần đúng nhưng sai chính tả sẽ bị coi là sai', async () => {
      mockLessonModel.findById.mockResolvedValue({
        ...mockLessonDoc,
        assignment: assignmentData,
      });

      const submission = {
        answers: [
          { questionId: q1Id, answer: 'Express' },
          { questionId: q2Id, answer: 'Apl' }, // Sai chính tả -> Fail
          { questionId: q3Id, answer: 'Python' }, // MCQ sai
          { questionId: q4Id, answer: 'Injectable' },
        ],
      };

      const result = await service.gradeAssignment(mockCourseId, mockLessonId, submission);

      expect(result.correctCount).toBe(2);
      expect(result.score).toBe(50);
      expect(result.passed).toBe(false); // 50% < 70% -> passed = false
    });

    it('tôn trọng ngưỡng passingScore tùy chỉnh (VD: passingScore = 80%)', async () => {
      const customAssignment = {
        ...assignmentData,
        passingScore: 80, // Đặt ngưỡng 80%
      };

      mockLessonModel.findById.mockResolvedValue({
        ...mockLessonDoc,
        assignment: customAssignment,
      });

      const submission = {
        answers: [
          { questionId: q1Id, answer: 'Express' },
          { questionId: q2Id, answer: 'App' },
          { questionId: q3Id, answer: 'JavaScript' },
          { questionId: q4Id, answer: 'Sai' },
        ],
      };

      const result = await service.gradeAssignment(mockCourseId, mockLessonId, submission);

      expect(result.score).toBe(75); // 3/4 = 75%
      expect(result.passingScore).toBe(80);
      expect(result.passed).toBe(false); // 75% < 80% -> passed = false
    });
  });

  describe('upsertAssignment', () => {
    it('ném lỗi BadRequestException nếu câu hỏi MCQ có đáp án không nằm trong options', async () => {
      mockLessonModel.findById.mockResolvedValue({ ...mockLessonDoc });

      const invalidDto = {
        passingScore: 70,
        questions: [
          {
            type: QuestionType.MCQ,
            content: 'Câu hỏi MCQ sai',
            options: ['A', 'B', 'C'],
            correctAnswer: 'D', // D không có trong [A, B, C]
          },
        ],
      };

      await expect(
        service.upsertAssignment(mockCourseId, mockLessonId, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
