import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import type { CategoryModel } from './schemas/category.schema';
import { Category, CategoryDocument, CategoryStatus } from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private readonly categoryModel: CategoryModel) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const slug = this.generateSlug(dto.name);
    const created = new this.categoryModel({
      ...dto,
      slug,
      status: CategoryStatus.ACTIVE,
    });
    return created.save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ status: CategoryStatus.ACTIVE }).exec();
  }

  async findOne(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Category ID: ${id}`);
    }
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    await this.assertExists(id);
    const updateData: any = { ...dto };
    if (dto.name) {
      updateData.slug = this.generateSlug(dto.name);
    }
    const updated = await this.categoryModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.softDeleteById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async assertExists(id: string): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Category ID: ${id}`);
    }
    const category = await this.categoryModel.findById(id);
    if (!category || category.deletedAt) {
      throw new NotFoundException(`Category with id ${id} does not exist`);
    }
    return category;
  }
}
