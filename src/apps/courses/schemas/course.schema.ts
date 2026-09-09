import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export enum CourseStatus {
  DRAFT = 'draft',
  READY = 'ready',
  PUBLISHED = 'published',
}

export type CourseDocument = Course & Document;

@Schema({
  collection: 'courses',
  timestamps: true,
})
export class Course {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  price!: number;

  @Prop({ type: Boolean, default: false })
  includedInVip!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Instructor', required: true, index: true })
  instructorId!: Types.ObjectId;

  @Prop({ type: String, enum: CourseStatus, default: CourseStatus.DRAFT })
  status!: CourseStatus;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

export interface CourseModel extends Model<CourseDocument> {
  softDeleteById(id: string): Promise<CourseDocument | null>;
  restoreById(id: string): Promise<CourseDocument | null>;
}
