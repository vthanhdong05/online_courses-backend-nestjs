import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { Subscription } from './schemas/subscription.schema';
import { SubscriptionStatus } from './schemas/subscription.schema';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService - Renewal Accumulation & Expiry Cron', () => {
  let service: SubscriptionsService;

  const mockStudentId = new Types.ObjectId().toString();
  const mockPlanId = new Types.ObjectId().toString();
  const mockSubId = new Types.ObjectId().toString();

  const mockPlan = {
    _id: new Types.ObjectId(mockPlanId),
    name: 'Gói VIP 1 Tháng',
    durationInDays: 30,
    price: 199000,
  };

  const mockSubscriptionModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockSubscriptionPlansService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    function MockModel(this: any, data: any) {
      Object.assign(this, data);
      this._id = new Types.ObjectId(mockSubId);
      this.save = jest.fn().mockResolvedValue(this);
    }
    MockModel.findOne = mockSubscriptionModel.findOne;
    MockModel.find = mockSubscriptionModel.find;
    MockModel.countDocuments = mockSubscriptionModel.countDocuments;
    MockModel.updateMany = mockSubscriptionModel.updateMany;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getModelToken(Subscription.name),
          useValue: MockModel,
        },
        {
          provide: SubscriptionPlansService,
          useValue: mockSubscriptionPlansService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('activateOrExtendSubscription', () => {
    it('tạo mới Subscription nếu học viên chưa có gói VIP nào đang active', async () => {
      mockSubscriptionPlansService.findOne.mockResolvedValue(mockPlan);
      mockSubscriptionModel.findOne.mockResolvedValue(null);

      const sub = await service.activateOrExtendSubscription(mockStudentId, mockPlanId);

      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
      expect(sub.startDate).toBeInstanceOf(Date);
      expect(sub.endDate).toBeInstanceOf(Date);

      // 30 ngày tương ứng 30 * 24 * 60 * 60 * 1000 ms
      const diffMs = sub.endDate.getTime() - sub.startDate.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(30);
    });

    it('gia hạn cộng dồn (Renewal Accumulation): nếu đang có VIP active, endDate mới = endDate cũ + durationInDays', async () => {
      mockSubscriptionPlansService.findOne.mockResolvedValue(mockPlan);

      const now = new Date();
      // Giả sử gói cũ còn hạn 10 ngày nữa
      const oldEndDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

      const existingSub: any = {
        _id: new Types.ObjectId(mockSubId),
        studentId: new Types.ObjectId(mockStudentId),
        planId: new Types.ObjectId(mockPlanId),
        startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        endDate: oldEndDate,
        status: SubscriptionStatus.ACTIVE,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockSubscriptionModel.findOne.mockResolvedValue(existingSub);

      const updated = await service.activateOrExtendSubscription(mockStudentId, mockPlanId);

      // Cũ còn 10 ngày + mua gói mới 30 ngày = tổng cộng 40 ngày kể từ now
      const expectedEndDateMs = oldEndDate.getTime() + 30 * 24 * 60 * 60 * 1000;
      expect(updated.endDate.getTime()).toBe(expectedEndDateMs);
    });
  });

  describe('expireSubscriptions', () => {
    it('chạy bulk updateMany chuyển các VIP quá hạn sang EXPIRED và trả về số lượng', async () => {
      mockSubscriptionModel.updateMany.mockResolvedValue({ modifiedCount: 5 });

      const count = await service.expireSubscriptions();

      expect(count).toBe(5);
      expect(mockSubscriptionModel.updateMany).toHaveBeenCalled();
    });
  });
});
