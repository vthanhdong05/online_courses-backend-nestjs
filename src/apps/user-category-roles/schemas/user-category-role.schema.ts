import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export enum UserCategoryRoleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export type UserCategoryRoleDocument = UserCategoryRole & Document;

@Schema({
  collection: 'user_category_roles',
  timestamps: true,
})
export class UserCategoryRole {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId!: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ type: String, enum: UserCategoryRoleStatus, default: UserCategoryRoleStatus.ACTIVE })
  status!: UserCategoryRoleStatus;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const UserCategoryRoleSchema = SchemaFactory.createForClass(UserCategoryRole);
UserCategoryRoleSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

export interface UserCategoryRoleModel extends Model<UserCategoryRoleDocument> {
  softDeleteById(id: string): Promise<UserCategoryRoleDocument | null>;
  restoreById(id: string): Promise<UserCategoryRoleDocument | null>;
}
