import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Types } from 'mongoose';
import { CoursesService } from '../courses/courses.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { GetLessonsQueryDto } from './dto/get-lessons.dto';
import { GradingResultDto, QuestionGradingDetailDto } from './dto/grading-result.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpsertAssignmentDto } from './dto/upsert-assignment.dto';
import { QuestionType } from './schemas/assignment.schema';
import type { LessonModel } from './schemas/lesson.schema';
import { Lesson, LessonDocument } from './schemas/lesson.schema';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson.name) private readonly lessonModel: LessonModel,
    private readonly coursesService: CoursesService,
  ) {}

  /**
   * Helper chuẩn hóa chuỗi trả lời cho fill_blank (trim + lowerCase)
   */
  normalizeAnswer(str: string | undefined | null): string {
    if (!str) return '';
    return str.trim().toLowerCase();
  }

  async create(courseId: string, dto: CreateLessonDto): Promise<LessonDocument> {
    await this.coursesService.assertExists(courseId);

    const created = new this.lessonModel({
      courseId: new Types.ObjectId(courseId),
      title: dto.title,
      videoUrl: dto.videoUrl,
      order: dto.order,
    });
    return created.save();
  }

  async findAll(
    query: GetLessonsQueryDto,
  ): Promise<{ items: LessonDocument[]; totalItems: number; totalPages: number }> {
    const { page = 1, limit = 10, courseId, search } = query;
    const filter: QueryFilter<LessonDocument> = {};

    if (courseId && Types.ObjectId.isValid(courseId)) {
      filter.courseId = new Types.ObjectId(courseId);
    }
    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      this.lessonModel
        .find(filter)
        .populate('courseId')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.lessonModel.countDocuments(filter),
    ]);

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    };
  }

  async findByCourseId(courseId: string): Promise<LessonDocument[]> {
    await this.coursesService.assertExists(courseId);
    return this.lessonModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .sort({ order: 1 })
      .exec();
  }

  async findOne(courseId: string, lessonId: string): Promise<LessonDocument> {
    if (!Types.ObjectId.isValid(courseId)) {
      throw new NotFoundException(`Invalid Course ID: ${courseId}`);
    }
    if (!Types.ObjectId.isValid(lessonId)) {
      throw new NotFoundException(`Invalid Lesson ID: ${lessonId}`);
    }

    const lesson = await this.lessonModel.findById(lessonId);
    if (!lesson || lesson.courseId.toString() !== courseId) {
      throw new NotFoundException(`Lesson ${lessonId} not found in course ${courseId}`);
    }
    return lesson;
  }

  async update(courseId: string, lessonId: string, dto: UpdateLessonDto): Promise<LessonDocument> {
    const lesson = await this.findOne(courseId, lessonId);

    if (dto.title !== undefined) lesson.title = dto.title;
    if (dto.videoUrl !== undefined) lesson.videoUrl = dto.videoUrl;
    if (dto.order !== undefined) lesson.order = dto.order;

    return lesson.save();
  }

  async remove(courseId: string, lessonId: string): Promise<LessonDocument> {
    await this.findOne(courseId, lessonId);
    const deleted = await this.lessonModel.softDeleteById(lessonId);
    if (!deleted) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }
    return deleted;
  }

  async upsertAssignment(
    courseId: string,
    lessonId: string,
    dto: UpsertAssignmentDto,
  ): Promise<LessonDocument> {
    const lesson = await this.findOne(courseId, lessonId);

    // Validate MCQ questions: options must include correctAnswer
    for (const [idx, q] of dto.questions.entries()) {
      if (q.type === QuestionType.MCQ) {
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
          throw new BadRequestException(
            `Câu hỏi MCQ vị trí ${idx + 1} ("${q.content}") phải có danh sách các lựa chọn (options)`,
          );
        }
        if (!q.options.includes(q.correctAnswer)) {
          throw new BadRequestException(
            `Câu hỏi MCQ vị trí ${idx + 1} ("${q.content}") đáp án đúng "${q.correctAnswer}" không nằm trong danh sách lựa chọn [${q.options.join(', ')}]`,
          );
        }
      }
    }

    lesson.assignment = {
      passingScore: dto.passingScore ?? 70,
      questions: dto.questions.map((q) => ({
        _id: new Types.ObjectId(),
        type: q.type,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
      })),
    };

    return lesson.save();
  }

  async gradeAssignment(
    courseId: string,
    lessonId: string,
    dto: SubmitAssignmentDto,
  ): Promise<GradingResultDto> {
    const lesson = await this.findOne(courseId, lessonId);

    if (
      !lesson.assignment ||
      !lesson.assignment.questions ||
      lesson.assignment.questions.length === 0
    ) {
      throw new BadRequestException(`Lesson ${lessonId} chưa có bài tập đính kèm để chấm điểm`);
    }

    const assignment = lesson.assignment;
    const studentAnswerMap = new Map<string, string>();
    for (const item of dto.answers) {
      studentAnswerMap.set(item.questionId, item.answer);
    }

    let correctCount = 0;
    const details: QuestionGradingDetailDto[] = [];

    for (const q of assignment.questions) {
      const qIdStr = q._id ? q._id.toString() : '';
      const studentAnswer = studentAnswerMap.get(qIdStr);
      let isCorrect = false;

      if (studentAnswer !== undefined && studentAnswer !== null) {
        if (q.type === QuestionType.MCQ) {
          // MCQ: so khớp chính xác nguyên bản
          isCorrect = studentAnswer === q.correctAnswer;
        } else if (q.type === QuestionType.FILL_BLANK) {
          // Fill blank: trim & lowerCase
          isCorrect = this.normalizeAnswer(studentAnswer) === this.normalizeAnswer(q.correctAnswer);
        }
      }

      if (isCorrect) {
        correctCount += 1;
      }

      details.push({
        questionId: qIdStr,
        isCorrect,
      });
    }

    const totalQuestions = assignment.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passingScore = assignment.passingScore ?? 70;
    const passed = score >= passingScore;

    return {
      totalQuestions,
      correctCount,
      score,
      passingScore,
      passed,
      details,
    };
  }
}
