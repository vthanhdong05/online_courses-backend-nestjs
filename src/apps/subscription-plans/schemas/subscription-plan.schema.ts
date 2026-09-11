import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type SubscriptionPlanDocument = SubscriptionPlan & Document;

@Schema({
  collection: 'subscription_plans',
  timestamps: true,
})
export class SubscriptionPlan {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 1 })
  durationInDays!: number;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);

export interface SubscriptionPlanModel extends Model<SubscriptionPlanDocument> {
  softDeleteById(id: string): Promise<SubscriptionPlanDocument | null>;
  restoreById(id: string): Promise<SubscriptionPlanDocument | null>;
}
