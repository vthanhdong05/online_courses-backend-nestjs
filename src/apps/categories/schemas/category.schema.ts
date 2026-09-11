import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export type CategoryDocument = Category & Document;

@Schema({
  collection: 'categories',
  timestamps: true,
})
export class Category {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug!: string;

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ type: String, enum: CategoryStatus, default: CategoryStatus.ACTIVE })
  status!: CategoryStatus;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

export interface CategoryModel extends Model<CategoryDocument> {
  softDeleteById(id: string): Promise<CategoryDocument | null>;
  restoreById(id: string): Promise<CategoryDocument | null>;
}
