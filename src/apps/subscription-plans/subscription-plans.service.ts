import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import type { SubscriptionPlanModel } from './schemas/subscription-plan.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from './schemas/subscription-plan.schema';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectModel(SubscriptionPlan.name)
    private readonly planModel: SubscriptionPlanModel,
  ) {}

  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanDocument> {
    const created = new this.planModel(dto);
    return created.save();
  }

  async findAll(): Promise<SubscriptionPlanDocument[]> {
    return this.planModel.find().sort({ price: 1 }).exec();
  }

  async findOne(id: string): Promise<SubscriptionPlanDocument> {
    return this.assertExists(id);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanDocument> {
    await this.assertExists(id);
    const updated = await this.planModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!updated) {
      throw new NotFoundException(`SubscriptionPlan with id ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<SubscriptionPlanDocument> {
    await this.assertExists(id);
    const deleted = await this.planModel.softDeleteById(id);
    if (!deleted) {
      throw new NotFoundException(`SubscriptionPlan with id ${id} not found`);
    }
    return deleted;
  }

  async assertExists(id: string): Promise<SubscriptionPlanDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid SubscriptionPlan ID: ${id}`);
    }
    const plan = await this.planModel.findById(id);
    if (!plan || plan.deletedAt) {
      throw new NotFoundException(`SubscriptionPlan with id ${id} does not exist`);
    }
    return plan;
  }
}
