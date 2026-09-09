import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { CategoryModel } from './schemas/category.schema';
import { Category, CategoryDocument, CategoryStatus } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private readonly categoryModel: CategoryModel) {}

  async create(data: Partial<Category>): Promise<CategoryDocument> {
    const slug =
      data.slug ||
      data.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    const created = new this.categoryModel({ ...data, slug });
    return created.save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ status: CategoryStatus.ACTIVE }).exec();
  }

  async findOne(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }
}
