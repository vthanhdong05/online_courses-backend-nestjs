import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Types } from 'mongoose';
import { CategoriesService } from '../categories/categories.service';
import { InstructorsService } from '../instructors/instructors.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { GetCoursesQueryDto } from './dto/get-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import type { CourseModel } from './schemas/course.schema';
import { Course, CourseDocument, CourseStatus } from './schemas/course.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: CourseModel,
    private readonly categoriesService: CategoriesService,
    private readonly instructorsService: InstructorsService,
  ) {}

  async create(dto: CreateCourseDto): Promise<CourseDocument> {
    await this.categoriesService.assertExists(dto.categoryId);
    await this.instructorsService.assertExists(dto.instructorId);

    const created = new this.courseModel({
      ...dto,
      categoryId: new Types.ObjectId(dto.categoryId),
      instructorId: new Types.ObjectId(dto.instructorId),
      status: CourseStatus.DRAFT,
    });
    return created.save();
  }

  async findAll(
    query: GetCoursesQueryDto,
  ): Promise<{ items: CourseDocument[]; totalItems: number; totalPages: number }> {
    const { page, limit, categoryId, instructorId, status, search } = query;
    const filter: QueryFilter<CourseDocument> = {};

    if (categoryId && Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new Types.ObjectId(categoryId);
    }
    if (instructorId && Types.ObjectId.isValid(instructorId)) {
      filter.instructorId = new Types.ObjectId(instructorId);
    }
    if (status) {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [items, totalItems] = await Promise.all([
      this.courseModel
        .find(filter)
        .populate('categoryId')
        .populate('instructorId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.courseModel.countDocuments(filter),
    ]);

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    };
  }

  async findOne(id: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Course ID: ${id}`);
    }
    const course = await this.courseModel
      .findById(id)
      .populate('categoryId')
      .populate('instructorId');
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<CourseDocument> {
    await this.assertExists(id);

    if (dto.categoryId) {
      await this.categoriesService.assertExists(dto.categoryId);
    }
    if (dto.instructorId) {
      await this.instructorsService.assertExists(dto.instructorId);
    }

    const updateData: any = { ...dto };
    if (dto.categoryId) {
      updateData.categoryId = new Types.ObjectId(dto.categoryId);
    }
    if (dto.instructorId) {
      updateData.instructorId = new Types.ObjectId(dto.instructorId);
    }

    const updated = await this.courseModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('categoryId')
      .populate('instructorId');

    if (!updated) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<CourseDocument> {
    const course = await this.courseModel.softDeleteById(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  async assertExists(id: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Course ID: ${id}`);
    }
    const course = await this.courseModel.findById(id);
    if (!course || course.deletedAt) {
      throw new NotFoundException(`Course with id ${id} does not exist`);
    }
    return course;
  }
}
