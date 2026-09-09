import { InstructorDocument } from '../schemas/instructor.schema';

export class InstructorResponseDto {
  id!: string;
  name!: string;
  avatar?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;

  static fromDocument(doc: InstructorDocument): InstructorResponseDto {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      id: doc._id.toString(),
      name: obj.name,
      avatar: obj.avatar,
      bio: obj.bio,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  static fromDocuments(docs: InstructorDocument[]): InstructorResponseDto[] {
    return docs.map((doc) => InstructorResponseDto.fromDocument(doc));
  }
}
