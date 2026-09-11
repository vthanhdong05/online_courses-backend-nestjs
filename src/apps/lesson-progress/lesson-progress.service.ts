import { forwardRef, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AccessService } from '../access/access.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { LessonsService } from '../lessons/lessons.service';
import {
  CourseProgressResponseDto,
  LessonProgressDetailDto,
} from './dto/course-progress-response.dto';
import type { LessonProgressModel } from './schemas/lesson-progress.schema';
import { LessonProgress, LessonProgressDocument } from './schemas/lesson-progress.schema';

@Injectable()
export class LessonProgressService {
  constructor(
    @InjectModel(LessonProgress.name)
    private readonly lessonProgressModel: LessonProgressModel,
    @Inject(forwardRef(() => LessonsService))
    private readonly lessonsService: LessonsService,
    @Inject(forwardRef(() => AccessService))
    private readonly accessService: AccessService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async markVideoCompleted(
    studentId: string,
    courseId: string,
    lessonId: string,
  ): Promise<LessonProgressDocument> {
    const canAccess = await this.accessService.canAccessCourse(studentId, courseId);
    if (!canAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập khóa học này');
    }

    const lesson = await this.lessonsService.findOne(courseId, lessonId);
    const hasAssignment = Boolean(
      lesson.assignment && lesson.assignment.questions && lesson.assignment.questions.length > 0,
    );

    let progress = await this.lessonProgressModel.findOne({
      studentId: new Types.ObjectId(studentId),
      lessonId: new Types.ObjectId(lessonId),
    });

    if (!progress) {
      progress = new this.lessonProgressModel({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
      });
    }

    progress.videoCompleted = true;
    progress.videoCompletedAt = new Date();

    // Quy tắc hoàn thành bài học (Lesson Completion Rule):
    // Bài học hoàn thành nếu: xem xong video VÀ (không có bài tập HOẶC đã pass bài tập)
    const isNowCompleted = progress.videoCompleted && (!hasAssignment || progress.assignmentPassed);
    if (isNowCompleted && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }

    const savedProgress = await progress.save();

    // Tính lại % tiến độ khóa học & tự động chuyển Enrollment sang COMPLETED nếu đạt 100%
    await this.calculateAndSyncCourseProgress(studentId, courseId);

    return savedProgress;
  }

  async recordAssignmentResult(
    studentId: string,
    courseId: string,
    lessonId: string,
    passed: boolean,
    score: number,
  ): Promise<LessonProgressDocument> {
    let progress = await this.lessonProgressModel.findOne({
      studentId: new Types.ObjectId(studentId),
      lessonId: new Types.ObjectId(lessonId),
    });

    if (!progress) {
      progress = new this.lessonProgressModel({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        lessonId: new Types.ObjectId(lessonId),
      });
    }

    if (passed) {
      progress.assignmentPassed = true;
      progress.assignmentPassedAt = new Date();
      progress.score = score;
    } else {
      progress.score = score;
    }

    // Quy tắc hoàn thành bài học
    const isNowCompleted = progress.videoCompleted && progress.assignmentPassed;
    if (isNowCompleted && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }

    const savedProgress = await progress.save();

    // Tính lại % tiến độ khóa học & tự động chuyển Enrollment sang COMPLETED nếu đạt 100%
    await this.calculateAndSyncCourseProgress(studentId, courseId);

    return savedProgress;
  }

  async calculateAndSyncCourseProgress(
    studentId: string,
    courseId: string,
  ): Promise<{
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    isCourseCompleted: boolean;
  }> {
    const lessons = await this.lessonsService.findByCourseId(courseId);
    const totalLessons = lessons.length;

    if (totalLessons === 0) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
        isCourseCompleted: false,
      };
    }

    const completedProgresses = await this.lessonProgressModel.find({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      isCompleted: true,
    });

    const completedLessons = completedProgresses.length;
    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    const isCourseCompleted = completedLessons === totalLessons;

    // Tự động chuyển Enrollment.status = completed khi tiến độ đạt 100%
    if (isCourseCompleted) {
      await this.enrollmentsService.markCourseCompleted(studentId, courseId);
    }

    return {
      totalLessons,
      completedLessons,
      progressPercentage,
      isCourseCompleted,
    };
  }

  async getCourseProgress(studentId: string, courseId: string): Promise<CourseProgressResponseDto> {
    const canAccess = await this.accessService.canAccessCourse(studentId, courseId);
    if (!canAccess) {
      throw new ForbiddenException('Bạn không có quyền truy cập khóa học này');
    }

    const lessons = await this.lessonsService.findByCourseId(courseId);
    const progressDocs = await this.lessonProgressModel.find({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });

    const progressMap = new Map<string, LessonProgressDocument>();
    for (const p of progressDocs) {
      progressMap.set(p.lessonId.toString(), p);
    }

    let completedCount = 0;
    const lessonsProgress: LessonProgressDetailDto[] = [];

    for (const lesson of lessons) {
      const lId = lesson._id.toString();
      const p = progressMap.get(lId);
      const hasAssignment = Boolean(
        lesson.assignment && lesson.assignment.questions && lesson.assignment.questions.length > 0,
      );

      const videoCompleted = p ? p.videoCompleted : false;
      const assignmentPassed = p ? p.assignmentPassed : false;
      const isCompleted = p ? p.isCompleted : false;

      if (isCompleted) {
        completedCount += 1;
      }

      lessonsProgress.push({
        lessonId: lId,
        lessonTitle: lesson.title,
        order: lesson.order,
        videoCompleted,
        hasAssignment,
        assignmentPassed,
        score: p ? p.score : null,
        isCompleted,
      });
    }

    const totalLessons = lessons.length;
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    const isCourseCompleted = totalLessons > 0 && completedCount === totalLessons;

    return {
      courseId,
      totalLessons,
      completedLessons: completedCount,
      progressPercentage,
      isCourseCompleted,
      lessonsProgress,
    };
  }
}
