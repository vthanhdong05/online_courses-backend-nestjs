import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import type { SubscriptionModel } from './schemas/subscription.schema';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: SubscriptionModel,
    private readonly subscriptionPlansService: SubscriptionPlansService,
  ) {}

  async activateOrExtendSubscription(
    studentId: string,
    planId: string,
    orderId?: string,
  ): Promise<SubscriptionDocument> {
    const plan = await this.subscriptionPlansService.findOne(planId);
    const now = new Date();

    // Tìm Subscription đang ACTIVE của học viên (nếu có)
    const activeSub = await this.subscriptionModel.findOne({
      studentId: new Types.ObjectId(studentId),
      status: SubscriptionStatus.ACTIVE,
      endDate: { $gt: now },
    });

    const addMs = plan.durationInDays * 24 * 60 * 60 * 1000;

    if (activeSub) {
      // Gia hạn cộng dồn (Renewal Accumulation): endDate mới = endDate cũ + durationInDays
      const currentEndDate = new Date(activeSub.endDate);
      const newEndDate = new Date(currentEndDate.getTime() + addMs);

      activeSub.endDate = newEndDate;
      activeSub.planId = new Types.ObjectId(planId);
      if (orderId) {
        activeSub.orderId = new Types.ObjectId(orderId);
      }
      this.logger.log(
        `Gia hạn VIP thành công cho học viên ${studentId}: Hạn cũ [${currentEndDate.toISOString()}] -> Hạn mới [${newEndDate.toISOString()}]`,
      );
      return activeSub.save();
    }

    // Nếu chưa có hoặc đã hết hạn -> Tạo mới Subscription với startDate = now, endDate = now + durationInDays
    const startDate = now;
    const endDate = new Date(startDate.getTime() + addMs);

    const created = new this.subscriptionModel({
      studentId: new Types.ObjectId(studentId),
      planId: new Types.ObjectId(planId),
      orderId: orderId ? new Types.ObjectId(orderId) : null,
      startDate,
      endDate,
      status: SubscriptionStatus.ACTIVE,
    });

    this.logger.log(
      `Tạo mới VIP cho học viên ${studentId}: Bắt đầu [${startDate.toISOString()}] -> Kết thúc [${endDate.toISOString()}]`,
    );
    return created.save();
  }

  async hasActiveSubscription(studentId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(studentId)) {
      return false;
    }
    const count = await this.subscriptionModel.countDocuments({
      studentId: new Types.ObjectId(studentId),
      status: SubscriptionStatus.ACTIVE,
      endDate: { $gt: new Date() },
    });
    return count > 0;
  }

  async expireSubscriptions(): Promise<number> {
    const now = new Date();
    const result = await this.subscriptionModel.updateMany(
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lt: now },
      },
      {
        $set: { status: SubscriptionStatus.EXPIRED },
      },
    );

    const updatedCount = result.modifiedCount || 0;
    if (updatedCount > 0) {
      this.logger.log(
        `CronJob Expiry: Đã quét và chuyển ${updatedCount} gói VIP hết hạn sang EXPIRED`,
      );
    }
    return updatedCount;
  }

  async findByStudentId(studentId: string): Promise<SubscriptionDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      return [];
    }
    return this.subscriptionModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('planId')
      .sort({ createdAt: -1 })
      .exec();
  }
}
