import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';
import { User } from '../../users/schemas/user.schema';

export type ReviewDocument = Review & Document;

@Schema({
  collection: 'reviews',
  timestamps: true,
})
export class Review {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Course.name, required: true, index: true })
  courseId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ type: String, required: true, trim: true })
  comment!: string;

  @Prop({ type: String, default: null, trim: true })
  replyComment?: string | null;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  repliedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  repliedAt?: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Compound unique index trên (studentId, courseId)
ReviewSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export interface ReviewModel extends Model<ReviewDocument> {
  softDeleteById(id: string): Promise<ReviewDocument | null>;
  restoreById(id: string): Promise<ReviewDocument | null>;
}
