import { ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AccessService } from '../access/access.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { LessonsService } from '../lessons/lessons.service';
import { LessonProgressService } from './lesson-progress.service';
import { LessonProgress } from './schemas/lesson-progress.schema';

describe('LessonProgressService', () => {
  let service: LessonProgressService;

  const mockStudentId = new Types.ObjectId().toString();
  const mockCourseId = new Types.ObjectId().toString();
  const mockLessonId1 = new Types.ObjectId().toString();
  const mockLessonId2 = new Types.ObjectId().toString();

  const mockAccessService = {
    canAccessCourse: jest.fn(),
  };

  const mockLessonsService = {
    findOne: jest.fn(),
    findByCourseId: jest.fn(),
  };

  const mockEnrollmentsService = {
    markCourseCompleted: jest.fn(),
  };

  let storedProgressDocs: any[] = [];

  function createMockProgressDoc(data: any) {
    const doc = {
      _id: new Types.ObjectId(),
      studentId: new Types.ObjectId(data.studentId || mockStudentId),
      courseId: new Types.ObjectId(data.courseId || mockCourseId),
      lessonId: new Types.ObjectId(data.lessonId || mockLessonId1),
      videoCompleted: data.videoCompleted ?? false,
      assignmentPassed: data.assignmentPassed ?? false,
      score: data.score ?? null,
      isCompleted: data.isCompleted ?? false,
      save: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      }),
    };
    return doc;
  }

  const mockLessonProgressModel = jest.fn().mockImplementation((dto) => {
    const newDoc = createMockProgressDoc(dto);
    storedProgressDocs.push(newDoc);
    return newDoc;
  });

  (mockLessonProgressModel as any).findOne = jest.fn().mockImplementation((query) => {
    const found = storedProgressDocs.find(
      (p) =>
        p.studentId.toString() === query.studentId.toString() &&
        p.lessonId.toString() === query.lessonId.toString(),
    );
    return Promise.resolve(found || null);
  });

  (mockLessonProgressModel as any).find = jest.fn().mockImplementation((query) => {
    let filtered = storedProgressDocs.filter(
      (p) =>
        p.studentId.toString() === query.studentId.toString() &&
        p.courseId.toString() === query.courseId.toString(),
    );
    if (query.isCompleted !== undefined) {
      filtered = filtered.filter((p) => p.isCompleted === query.isCompleted);
    }
    return Promise.resolve(filtered);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    storedProgressDocs = [];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonProgressService,
        {
          provide: getModelToken(LessonProgress.name),
          useValue: mockLessonProgressModel,
        },
        {
          provide: AccessService,
          useValue: mockAccessService,
        },
        {
          provide: LessonsService,
          useValue: mockLessonsService,
        },
        {
          provide: EnrollmentsService,
          useValue: mockEnrollmentsService,
        },
      ],
    }).compile();

    service = module.get<LessonProgressService>(LessonProgressService);
  });

  describe('markVideoCompleted', () => {
    it('throws ForbiddenException if student does not have course access', async () => {
      mockAccessService.canAccessCourse.mockResolvedValue(false);

      await expect(
        service.markVideoCompleted(mockStudentId, mockCourseId, mockLessonId1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('marks video completed and completes lesson if NO assignment exists', async () => {
      mockAccessService.canAccessCourse.mockResolvedValue(true);
      mockLessonsService.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockLessonId1),
        assignment: null,
      });
      mockLessonsService.findByCourseId.mockResolvedValue([
        { _id: new Types.ObjectId(mockLessonId1) },
      ]);

      const progress = await service.markVideoCompleted(mockStudentId, mockCourseId, mockLessonId1);

      expect(progress.videoCompleted).toBe(true);
      expect(progress.isCompleted).toBe(true);
      expect(mockEnrollmentsService.markCourseCompleted).toHaveBeenCalledWith(
        mockStudentId,
        mockCourseId,
      );
    });

    it('marks video completed BUT leaves lesson incomplete if assignment exists and is not passed', async () => {
      mockAccessService.canAccessCourse.mockResolvedValue(true);
      mockLessonsService.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockLessonId1),
        assignment: { questions: [{ content: 'Question 1' }] },
      });
      mockLessonsService.findByCourseId.mockResolvedValue([
        { _id: new Types.ObjectId(mockLessonId1) },
      ]);

      const progress = await service.markVideoCompleted(mockStudentId, mockCourseId, mockLessonId1);

      expect(progress.videoCompleted).toBe(true);
      expect(progress.isCompleted).toBe(false);
    });
  });

  describe('recordAssignmentResult', () => {
    it('records assignment result and marks lesson completed when video was already watched', async () => {
      mockAccessService.canAccessCourse.mockResolvedValue(true);
      mockLessonsService.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockLessonId1),
        assignment: { questions: [{ content: 'Question 1' }] },
      });
      mockLessonsService.findByCourseId.mockResolvedValue([
        { _id: new Types.ObjectId(mockLessonId1) },
      ]);

      // Step 1: Watch video first
      await service.markVideoCompleted(mockStudentId, mockCourseId, mockLessonId1);

      // Step 2: Record passing assignment result
      const progress = await service.recordAssignmentResult(
        mockStudentId,
        mockCourseId,
        mockLessonId1,
        true,
        85,
      );

      expect(progress.assignmentPassed).toBe(true);
      expect(progress.score).toBe(85);
      expect(progress.isCompleted).toBe(true);
      expect(mockEnrollmentsService.markCourseCompleted).toHaveBeenCalledWith(
        mockStudentId,
        mockCourseId,
      );
    });
  });

  describe('calculateAndSyncCourseProgress', () => {
    it('computes 50% course progress for 2/4 completed lessons and does NOT mark course completed', async () => {
      mockLessonsService.findByCourseId.mockResolvedValue([
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
      ]);

      // Add 2 completed progress docs
      storedProgressDocs.push(
        createMockProgressDoc({
          studentId: mockStudentId,
          courseId: mockCourseId,
          isCompleted: true,
        }),
        createMockProgressDoc({
          studentId: mockStudentId,
          courseId: mockCourseId,
          isCompleted: true,
        }),
        createMockProgressDoc({
          studentId: mockStudentId,
          courseId: mockCourseId,
          isCompleted: false,
        }),
      );

      const result = await service.calculateAndSyncCourseProgress(mockStudentId, mockCourseId);

      expect(result.totalLessons).toBe(4);
      expect(result.completedLessons).toBe(2);
      expect(result.progressPercentage).toBe(50);
      expect(result.isCourseCompleted).toBe(false);
      expect(mockEnrollmentsService.markCourseCompleted).not.toHaveBeenCalled();
    });

    it('computes 100% course progress and calls markCourseCompleted when all lessons completed', async () => {
      mockLessonsService.findByCourseId.mockResolvedValue([
        { _id: new Types.ObjectId(mockLessonId1) },
        { _id: new Types.ObjectId(mockLessonId2) },
      ]);

      storedProgressDocs.push(
        createMockProgressDoc({
          studentId: mockStudentId,
          courseId: mockCourseId,
          lessonId: mockLessonId1,
          isCompleted: true,
        }),
        createMockProgressDoc({
          studentId: mockStudentId,
          courseId: mockCourseId,
          lessonId: mockLessonId2,
          isCompleted: true,
        }),
      );

      const result = await service.calculateAndSyncCourseProgress(mockStudentId, mockCourseId);

      expect(result.totalLessons).toBe(2);
      expect(result.completedLessons).toBe(2);
      expect(result.progressPercentage).toBe(100);
      expect(result.isCourseCompleted).toBe(true);
      expect(mockEnrollmentsService.markCourseCompleted).toHaveBeenCalledWith(
        mockStudentId,
        mockCourseId,
      );
    });
  });
});
