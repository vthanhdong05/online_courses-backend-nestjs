import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import type { InstructorModel } from './schemas/instructor.schema';
import { Instructor, InstructorDocument } from './schemas/instructor.schema';

@Injectable()
export class InstructorsService {
  constructor(
    @InjectModel(Instructor.name)
    private readonly instructorModel: InstructorModel,
  ) {}

  async create(dto: CreateInstructorDto): Promise<InstructorDocument> {
    const created = new this.instructorModel(dto);
    return created.save();
  }

  async findAll(): Promise<InstructorDocument[]> {
    return this.instructorModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<InstructorDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Instructor ID: ${id}`);
    }
    const instructor = await this.instructorModel.findById(id);
    if (!instructor) {
      throw new NotFoundException(`Instructor with id ${id} not found`);
    }
    return instructor;
  }

  async update(id: string, dto: UpdateInstructorDto): Promise<InstructorDocument> {
    await this.assertExists(id);
    const updated = await this.instructorModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!updated) {
      throw new NotFoundException(`Instructor with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<InstructorDocument> {
    const instructor = await this.instructorModel.softDeleteById(id);
    if (!instructor) {
      throw new NotFoundException(`Instructor with id ${id} not found`);
    }
    return instructor;
  }

  async assertExists(id: string): Promise<InstructorDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid Instructor ID: ${id}`);
    }
    const instructor = await this.instructorModel.findById(id);
    if (!instructor || instructor.deletedAt) {
      throw new NotFoundException(`Instructor with id ${id} does not exist`);
    }
    return instructor;
  }
}
