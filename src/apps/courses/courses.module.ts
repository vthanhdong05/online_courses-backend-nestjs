import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesModule } from '../categories/categories.module';
import { InstructorsModule } from '../instructors/instructors.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { COURSE_PUBLISH_VALIDATOR } from './interfaces/course-publish-validator.interface';
import { Course, CourseSchema } from './schemas/course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
    CategoriesModule,
    InstructorsModule,
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    {
      provide: COURSE_PUBLISH_VALIDATOR,
      useValue: {
        validate: async (_courseId: string) => {
          // Default no-op publish validator for Phase 2.
          // Will be overridden by LessonsModule in Phase 3.
        },
      },
    },
  ],
  exports: [CoursesService, MongooseModule, COURSE_PUBLISH_VALIDATOR],
})
export class CoursesModule {}
