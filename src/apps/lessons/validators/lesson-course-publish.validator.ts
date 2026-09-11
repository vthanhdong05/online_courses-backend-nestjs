import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { ICoursePublishValidator } from '../../courses/interfaces/course-publish-validator.interface';
import { QuestionType } from '../schemas/assignment.schema';
import type { LessonModel } from '../schemas/lesson.schema';
import { Lesson } from '../schemas/lesson.schema';

@Injectable()
export class LessonCoursePublishValidator implements ICoursePublishValidator {
  constructor(@InjectModel(Lesson.name) private readonly lessonModel: LessonModel) {}

  async validate(courseId: string): Promise<void> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new BadRequestException(`Course ID không hợp lệ: ${courseId}`);
    }

    const lessons = await this.lessonModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .exec();

    if (lessons.length === 0) {
      throw new BadRequestException(
        'Khóa học chưa có bài học (Lesson) nào. Vui lòng thêm ít nhất 1 bài học trước khi xuất bản.',
      );
    }

    const validationErrors: string[] = [];

    for (const [index, lesson] of lessons.entries()) {
      const lessonLabel = `Bài ${index + 1} "${lesson.title || 'Không tên'}"`;
      const lessonIssues: string[] = [];

      // 1. Kiểm tra videoUrl
      if (!lesson.videoUrl || !lesson.videoUrl.trim()) {
        lessonIssues.push('thiếu videoUrl');
      }

      // 2. Kiểm tra assignment
      if (!lesson.assignment) {
        lessonIssues.push('thiếu bài tập (Assignment)');
      } else {
        const assignment = lesson.assignment;
        if (!assignment.questions || assignment.questions.length === 0) {
          lessonIssues.push('bài tập chưa có câu hỏi nào');
        } else {
          for (const [qIdx, q] of assignment.questions.entries()) {
            const qLabel = `Câu ${qIdx + 1}`;
            if (!q.correctAnswer || !q.correctAnswer.trim()) {
              lessonIssues.push(`${qLabel} thiếu đáp án đúng (correctAnswer)`);
            }
            if (q.type === QuestionType.MCQ) {
              if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
                lessonIssues.push(`${qLabel} (MCQ) thiếu danh sách lựa chọn (options)`);
              } else if (!q.options.includes(q.correctAnswer)) {
                lessonIssues.push(
                  `${qLabel} (MCQ) đáp án đúng "${q.correctAnswer}" không nằm trong options`,
                );
              }
            }
          }
        }
      }

      if (lessonIssues.length > 0) {
        validationErrors.push(`${lessonLabel}: ${lessonIssues.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        `Khóa học chưa đủ điều kiện xuất bản (PUBLISHED):\n- ${validationErrors.join('\n- ')}`,
      );
    }
  }
}
