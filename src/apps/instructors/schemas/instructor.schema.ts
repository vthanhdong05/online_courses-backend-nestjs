import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type InstructorDocument = Instructor & Document;

@Schema({
  collection: 'instructors',
  timestamps: true,
})
export class Instructor {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: false, trim: true })
  avatar?: string;

  @Prop({ required: false, trim: true })
  bio?: string;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const InstructorSchema = SchemaFactory.createForClass(Instructor);

export interface InstructorModel extends Model<InstructorDocument> {
  softDeleteById(id: string): Promise<InstructorDocument | null>;
  restoreById(id: string): Promise<InstructorDocument | null>;
}
