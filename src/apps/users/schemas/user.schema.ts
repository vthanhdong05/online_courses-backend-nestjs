import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  STUDENT = 'student',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export type UserDocument = User & Document;

@Schema({
  collection: 'users',
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: false, select: false })
  password?: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop()
  phone?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role!: UserRole;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Prop({ type: String, enum: UserProvider, default: UserProvider.LOCAL })
  provider!: UserProvider;

  @Prop({ type: String, required: false, index: { unique: true, sparse: true } })
  googleId?: string;

  @Prop({ type: String, required: false, select: false })
  resetToken?: string | null;

  @Prop()
  createdBy?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

export interface UserModel extends Model<UserDocument> {
  softDeleteById(id: string): Promise<UserDocument | null>;
  restoreById(id: string): Promise<UserDocument | null>;
}
