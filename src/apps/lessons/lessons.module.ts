import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesModule } from '../courses/courses.module';
import { LessonProgressModule } from '../lesson-progress/lesson-progress.module';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson, LessonSchema } from './schemas/lesson.schema';
import { LessonCoursePublishValidator } from './validators/lesson-course-publish.validator';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lesson.name, schema: LessonSchema }]),
    forwardRef(() => CoursesModule),
    forwardRef(() => LessonProgressModule),
  ],
  controllers: [LessonsController],
  providers: [LessonsService, LessonCoursePublishValidator],
  exports: [LessonsService, LessonCoursePublishValidator, MongooseModule],
})
export class LessonsModule {}
