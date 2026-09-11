import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';
import { Assignment, AssignmentSchema } from './assignment.schema';

export type LessonDocument = Lesson & Document;

@Schema({
  collection: 'lessons',
  timestamps: true,
})
export class Lesson {
  @Prop({ type: Types.ObjectId, ref: Course.name, required: true, index: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 1 })
  order!: number;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  videoUrl!: string;

  @Prop({ type: AssignmentSchema, default: null })
  assignment?: Assignment | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);

export interface LessonModel extends Model<LessonDocument> {
  softDeleteById(id: string): Promise<LessonDocument | null>;
  restoreById(id: string): Promise<LessonDocument | null>;
}
