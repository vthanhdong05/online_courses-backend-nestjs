import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';
import { Lesson } from '../../lessons/schemas/lesson.schema';
import { User } from '../../users/schemas/user.schema';

export type LessonProgressDocument = LessonProgress & Document;

@Schema({
  collection: 'lesson_progresses',
  timestamps: true,
})
export class LessonProgress {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Course.name, required: true, index: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Lesson.name, required: true, index: true })
  lessonId!: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  videoCompleted!: boolean;

  @Prop({ type: Date, default: null })
  videoCompletedAt?: Date | null;

  @Prop({ type: Boolean, default: false })
  assignmentPassed!: boolean;

  @Prop({ type: Date, default: null })
  assignmentPassedAt?: Date | null;

  @Prop({ type: Number, default: null })
  score?: number | null;

  @Prop({ type: Boolean, default: false, index: true })
  isCompleted!: boolean;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;
}

export const LessonProgressSchema = SchemaFactory.createForClass(LessonProgress);

// Compound unique index cho (studentId, lessonId)
LessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export interface LessonProgressModel extends Model<LessonProgressDocument> {
  softDeleteById(id: string): Promise<LessonProgressDocument | null>;
  restoreById(id: string): Promise<LessonProgressDocument | null>;
}
