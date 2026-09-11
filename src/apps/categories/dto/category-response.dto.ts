import { CategoryDocument, CategoryStatus } from '../schemas/category.schema';

export class CategoryResponseDto {
  id!: string;
  name!: string;
  slug!: string;
  description?: string;
  status!: CategoryStatus;
  createdAt?: Date;
  updatedAt?: Date;

  static fromDocument(doc: CategoryDocument): CategoryResponseDto {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      id: doc._id.toString(),
      name: obj.name,
      slug: obj.slug,
      description: obj.description,
      status: obj.status,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  static fromDocuments(docs: CategoryDocument[]): CategoryResponseDto[] {
    return docs.map((doc) => CategoryResponseDto.fromDocument(doc));
  }
}
