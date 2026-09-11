import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { SubscriptionPlan } from '../../subscription-plans/schemas/subscription-plan.schema';
import { User } from '../../users/schemas/user.schema';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export type SubscriptionDocument = Subscription & Document;

@Schema({
  collection: 'subscriptions',
  timestamps: true,
})
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: SubscriptionPlan.name, required: true, index: true })
  planId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', default: null })
  orderId?: Types.ObjectId | null;

  @Prop({ type: Date, required: true, default: Date.now })
  startDate!: Date;

  @Prop({ type: Date, required: true, index: true })
  endDate!: Date;

  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE, index: true })
  status!: SubscriptionStatus;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

export interface SubscriptionModel extends Model<SubscriptionDocument> {
  softDeleteById(id: string): Promise<SubscriptionDocument | null>;
  restoreById(id: string): Promise<SubscriptionDocument | null>;
}
