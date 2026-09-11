import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryAccessGuard } from 'src/common/guards/category-access.guard';
import { CategoriesModule } from '../categories/categories.module';
import { InstructorsModule } from '../instructors/instructors.module';
import { LessonsModule } from '../lessons/lessons.module';
import { LessonCoursePublishValidator } from '../lessons/validators/lesson-course-publish.validator';
import { UserCategoryRolesModule } from '../user-category-roles/user-category-roles.module';
import { UsersModule } from '../users/users.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { COURSE_PUBLISH_VALIDATOR } from './interfaces/course-publish-validator.interface';
import { Course, CourseSchema } from './schemas/course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
    CategoriesModule,
    InstructorsModule,
    UsersModule,
    UserCategoryRolesModule,
    forwardRef(() => LessonsModule),
  ],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    CategoryAccessGuard,
    {
      provide: COURSE_PUBLISH_VALIDATOR,
      useClass: LessonCoursePublishValidator,
    },
  ],
  exports: [CoursesService, MongooseModule, COURSE_PUBLISH_VALIDATOR],
})
export class CoursesModule {}
