import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';
import { User } from '../../users/schemas/user.schema';

export enum AccessType {
  PURCHASED = 'purchased',
  VIP = 'vip',
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export type EnrollmentDocument = Enrollment & Document;

@Schema({
  collection: 'enrollments',
  timestamps: true,
})
export class Enrollment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Course.name, required: true, index: true })
  courseId!: Types.ObjectId;

  @Prop({ type: String, enum: AccessType, default: AccessType.PURCHASED })
  accessType!: AccessType;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderId?: Types.ObjectId | null;

  @Prop({ type: String, enum: EnrollmentStatus, default: EnrollmentStatus.ACTIVE, index: true })
  status!: EnrollmentStatus;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: Date, default: Date.now })
  enrolledAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);

// Compound unique index trên (studentId, courseId)
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export interface EnrollmentModel extends Model<EnrollmentDocument> {
  softDeleteById(id: string): Promise<EnrollmentDocument | null>;
  restoreById(id: string): Promise<EnrollmentDocument | null>;
}
