import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum QuestionType {
  MCQ = 'mcq',
  FILL_BLANK = 'fill_blank',
}

@Schema({ _id: true, timestamps: false })
export class Question {
  _id: Types.ObjectId;

  @Prop({ required: true, enum: QuestionType })
  type: QuestionType;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [String], default: undefined })
  options?: string[];

  @Prop({ required: true, trim: true })
  correctAnswer: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

@Schema({ _id: false, timestamps: false })
export class Assignment {
  @Prop({ required: true, default: 70, min: 0, max: 100 })
  passingScore: number;

  @Prop({ type: [QuestionSchema], default: [] })
  questions: Question[];
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
