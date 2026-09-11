import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { CourseProgressResponseDto } from './dto/course-progress-response.dto';
import { LessonProgressService } from './lesson-progress.service';

@ApiTags('lesson-progress')
@Controller('courses/:courseId')
export class LessonProgressController {
  constructor(private readonly lessonProgressService: LessonProgressService) {}

  @Post('lessons/:lessonId/progress/video')
  @ApiOperation({ summary: 'Đánh dấu đã xem xong video bài học' })
  async markVideoCompleted(
    @CurrentUser('userId') studentId: string,
    @Param('courseId', ParseObjectIdPipe) courseId: string,
    @Param('lessonId', ParseObjectIdPipe) lessonId: string,
  ) {
    return this.lessonProgressService.markVideoCompleted(studentId, courseId, lessonId);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Lấy tổng quan tiến độ học tập của khóa học' })
  async getCourseProgress(
    @CurrentUser('userId') studentId: string,
    @Param('courseId', ParseObjectIdPipe) courseId: string,
  ): Promise<CourseProgressResponseDto> {
    return this.lessonProgressService.getCourseProgress(studentId, courseId);
  }
}
