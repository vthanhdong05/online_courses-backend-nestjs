import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { Roles } from '../auth/auth.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { LessonProgressService } from '../lesson-progress/lesson-progress.service';
import { UserRole } from '../users/schemas/user.schema';
import { AssignmentPublicResponseDto } from './dto/assignment-response.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { forwardRef, Inject } from '@nestjs/common';
import { GetLessonsQueryDto } from './dto/get-lessons.dto';
import { GradingResultDto } from './dto/grading-result.dto';
import { LessonResponseDto, PaginatedLessonsResponseDto } from './dto/lesson-response.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { UpsertAssignmentDto } from './dto/upsert-assignment.dto';
import { LessonsService } from './lessons.service';

@ApiTags('lessons')
@Controller(['lessons', 'courses/:courseId/lessons'])
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    @Inject(forwardRef(() => LessonProgressService))
    private readonly lessonProgressService: LessonProgressService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  @ApiOperation({ summary: 'Tạo bài học mới cho Khóa học (Admin/Instructor)' })
  async create(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Body() dto: CreateLessonDto,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonsService.create(courseId, dto);
    return LessonResponseDto.fromDocument(lesson, true);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách Bài học (Tất cả bài học có phân trang & filter, hoặc theo Course ID)',
  })
  async findAll(
    @Query() query: GetLessonsQueryDto,
    @Param('courseId') courseIdParam?: string,
  ): Promise<PaginatedLessonsResponseDto | LessonResponseDto[]> {
    if (courseIdParam) {
      const lessons = await this.lessonsService.findByCourseId(courseIdParam);
      return LessonResponseDto.fromDocuments(lessons, false);
    }

    const { items, totalItems, totalPages } = await this.lessonsService.findAll(query);
    return {
      items: LessonResponseDto.fromDocuments(items, false),
      totalItems,
      totalPages,
      page: query.page || 1,
      limit: query.limit || 10,
    };
  }

  @Get(':lessonId')
  @ApiOperation({ summary: 'Lấy chi tiết 1 bài học' })
  async findOne(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('lessonId', ParseObjectIdPipe) lessonId: string,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonsService.findOne(courseId, lessonId);
    return LessonResponseDto.fromDocument(lesson, false);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':lessonId')
  @ApiOperation({ summary: 'Cập nhật bài học (Admin/Instructor)' })
  async update(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('lessonId', ParseObjectIdPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonsService.update(courseId, lessonId, dto);
    return LessonResponseDto.fromDocument(lesson, true);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Delete(':lessonId')
  @ApiOperation({ summary: 'Xóa bài học (xóa mềm - Admin/Instructor)' })
  async remove(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('lessonId', ParseObjectIdPipe) lessonId: string,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonsService.remove(courseId, lessonId);
    return LessonResponseDto.fromDocument(lesson, true);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Put(':lessonId/assignment')
  @ApiOperation({ summary: 'Tạo hoặc Cập nhật bộ bài tập cho Bài học (Admin/Instructor)' })
  async upsertAssignment(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('lessonId', ParseObjectIdPipe) lessonId: string,
    @Body() dto: UpsertAssignmentDto,
  ): Promise<LessonResponseDto> {
    const lesson = await this.lessonsService.upsertAssignment(courseId, lessonId, dto);
    return LessonResponseDto.fromDocument(lesson, true);
  }

  @Get(':lessonId/assignment')
  @ApiOperation({ summary: 'Lấy đề bài tập của Bài học (Học viên - Lọc bỏ đáp án)' })
  async getAssignment(
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('lessonId', ParseObjectIdPipe) lessonId: string,
  ): Promise<AssignmentPublicResponseDto | null> {
    const lesson = await this.lessonsService.findOne(courseId, lessonId);
    return AssignmentPublicResponseDto.fromDocument(lesson.assignment);
  }

  @Post(':lessonId/assignment/submit')
  @ApiOperation({ summary: 'Nộp bài tập & Nhận kết quả chấm điểm ngay lập tức' })
  async gradeAssignment(
    @CurrentUser('userId') studentId: string,
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('lessonId', ParseObjectIdPipe) lessonId: string,
    @Body() dto: SubmitAssignmentDto,
  ): Promise<GradingResultDto> {
    const result = await this.lessonsService.gradeAssignment(courseId, lessonId, dto);
    if (studentId) {
      await this.lessonProgressService.recordAssignmentResult(
        studentId,
        courseId,
        lessonId,
        result.passed,
        result.score,
      );
    }
    return result;
  }
}
