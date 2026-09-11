import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessModule } from '../access/access.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { LessonsModule } from '../lessons/lessons.module';
import { LessonProgressController } from './lesson-progress.controller';
import { LessonProgressService } from './lesson-progress.service';
import { LessonProgress, LessonProgressSchema } from './schemas/lesson-progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LessonProgress.name, schema: LessonProgressSchema }]),
    forwardRef(() => LessonsModule),
    forwardRef(() => AccessModule),
    EnrollmentsModule,
  ],
  controllers: [LessonProgressController],
  providers: [LessonProgressService],
  exports: [LessonProgressService, MongooseModule],
})
export class LessonProgressModule {}
