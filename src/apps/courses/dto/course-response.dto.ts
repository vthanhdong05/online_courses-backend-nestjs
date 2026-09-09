import { CourseDocument, CourseStatus } from '../schemas/course.schema';

export class CourseResponseDto {
  id!: string;
  title!: string;
  description?: string;
  price!: number;
  includedInVip!: boolean;
  categoryId!: any;
  instructorId!: any;
  status!: CourseStatus;
  createdAt?: Date;
  updatedAt?: Date;

  static fromDocument(doc: CourseDocument): CourseResponseDto {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      id: doc._id.toString(),
      title: obj.title,
      description: obj.description,
      price: obj.price,
      includedInVip: obj.includedInVip,
      categoryId: obj.categoryId,
      instructorId: obj.instructorId,
      status: obj.status,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  static fromDocuments(docs: CourseDocument[]): CourseResponseDto[] {
    return docs.map((doc) => CourseResponseDto.fromDocument(doc));
  }
}

export class PaginatedCoursesResponseDto {
  items!: CourseResponseDto[];
  totalItems!: number;
  totalPages!: number;
  page!: number;
  limit!: number;
}
