import {
  UserCategoryRoleDocument,
  UserCategoryRoleStatus,
} from '../schemas/user-category-role.schema';

export class UserCategoryRoleResponseDto {
  id!: string;
  userId!: any;
  categoryId!: any;
  permissions!: string[];
  status!: UserCategoryRoleStatus;
  createdAt?: Date;
  updatedAt?: Date;

  static fromDocument(doc: UserCategoryRoleDocument): UserCategoryRoleResponseDto {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      id: doc._id.toString(),
      userId: obj.userId,
      categoryId: obj.categoryId,
      permissions: obj.permissions || [],
      status: obj.status,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  static fromDocuments(docs: UserCategoryRoleDocument[]): UserCategoryRoleResponseDto[] {
    return docs.map((doc) => UserCategoryRoleResponseDto.fromDocument(doc));
  }
}
