import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { Course } from '../../courses/schemas/course.schema';
import { User } from '../../users/schemas/user.schema';

export enum OrderType {
  COURSE = 'course',
  SUBSCRIPTION = 'subscription',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export type OrderDocument = Order & Document;

@Schema({
  collection: 'orders',
  timestamps: true,
})
export class Order {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: String, enum: OrderType, default: OrderType.COURSE })
  type!: OrderType;

  @Prop({ type: Types.ObjectId, ref: Course.name, default: null, index: true })
  courseId?: Types.ObjectId | null;

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status!: OrderStatus;

  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

export interface OrderModel extends Model<OrderDocument> {
  softDeleteById(id: string): Promise<OrderDocument | null>;
  restoreById(id: string): Promise<OrderDocument | null>;
}
