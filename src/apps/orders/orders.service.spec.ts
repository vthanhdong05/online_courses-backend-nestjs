import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CoursesService } from '../courses/courses.service';
import { CourseStatus } from '../courses/schemas/course.schema';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { SubscriptionPlansService } from '../subscription-plans/subscription-plans.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { OrdersService } from './orders.service';
import { Order, OrderStatus, OrderType } from './schemas/order.schema';

describe('OrdersService - Course Purchase & Idempotent Payment Confirmation', () => {
  let service: OrdersService;

  const mockStudentId = new Types.ObjectId().toString();
  const mockCourseId = new Types.ObjectId().toString();
  const mockOrderId = new Types.ObjectId().toString();

  const mockPublishedCourse: any = {
    _id: new Types.ObjectId(mockCourseId),
    title: 'Khóa học NestJS Nâng Cao',
    price: 499000,
    status: CourseStatus.PUBLISHED,
  };

  const mockDraftCourse: any = {
    _id: new Types.ObjectId(mockCourseId),
    title: 'Khóa học Đang Soạn',
    price: 299000,
    status: CourseStatus.DRAFT,
  };

  const mockOrderDoc: any = {
    _id: new Types.ObjectId(mockOrderId),
    studentId: new Types.ObjectId(mockStudentId),
    type: OrderType.COURSE,
    courseId: new Types.ObjectId(mockCourseId),
    amount: 499000,
    status: OrderStatus.PENDING,
    paidAt: null,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockOrderModel = {
    findById: jest.fn(),
    find: jest.fn(),
  };

  const mockCoursesService = {
    findOne: jest.fn(),
  };

  const mockEnrollmentsService = {
    isEnrolled: jest.fn(),
    createEnrollment: jest.fn(),
  };

  const mockSubscriptionPlansService = {
    findOne: jest.fn(),
  };

  const mockSubscriptionsService = {
    activateOrExtendSubscription: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
        {
          provide: EnrollmentsService,
          useValue: mockEnrollmentsService,
        },
        {
          provide: SubscriptionPlansService,
          useValue: mockSubscriptionPlansService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('create', () => {
    it('từ chối tạo đơn mua khóa học chưa xuất bản (status = draft hoặc ready)', async () => {
      mockCoursesService.findOne.mockResolvedValue(mockDraftCourse);

      await expect(service.create(mockStudentId, { courseId: mockCourseId })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('từ chối tạo đơn nếu học viên đã có Enrollment active cho khóa học đó (chống mua trùng)', async () => {
      mockCoursesService.findOne.mockResolvedValue(mockPublishedCourse);
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true); // Học viên đã sở hữu khóa học

      await expect(service.create(mockStudentId, { courseId: mockCourseId })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('tạo đơn thành công với amount lấy trực tiếp từ course.price trong DB', async () => {
      mockCoursesService.findOne.mockResolvedValue(mockPublishedCourse);
      mockEnrollmentsService.isEnrolled.mockResolvedValue(false);

      function MockOrderConstructor(this: any, data: any) {
        Object.assign(this, data);
        this._id = new Types.ObjectId(mockOrderId);
        this.save = jest.fn().mockResolvedValue(this);
      }

      (service as any).orderModel = jest
        .fn()
        .mockImplementation((data) => new (MockOrderConstructor as any)(data));

      const order = await service.create(mockStudentId, { courseId: mockCourseId });

      expect(order.amount).toBe(499000); // Khớp với course.price trong DB
      expect(order.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('confirmPayment', () => {
    it('báo lỗi NotFoundException nếu không tìm thấy đơn hàng', async () => {
      mockOrderModel.findById.mockResolvedValue(null);

      await expect(service.confirmPayment(mockOrderId)).rejects.toThrow(NotFoundException);
    });

    it('xác nhận thanh toán lần 1: Order chuyển status = PAID, paidAt được cập nhật, Enrollment được tạo', async () => {
      const pendingOrder = { ...mockOrderDoc, status: OrderStatus.PENDING };
      mockOrderModel.findById.mockResolvedValue(pendingOrder);
      mockEnrollmentsService.createEnrollment.mockResolvedValue({ id: 'enrollment-1' });

      const updated = await service.confirmPayment(mockOrderId);

      expect(updated.status).toBe(OrderStatus.PAID);
      expect(updated.paidAt).toBeInstanceOf(Date);
      expect(mockEnrollmentsService.createEnrollment).toHaveBeenCalledWith(
        mockStudentId,
        mockCourseId,
        'purchased',
        mockOrderId,
      );
    });

    it('kiểm thử tính Idempotency khi gọi confirmPayment lần 2: không tạo thêm Enrollment thứ 2 và không báo lỗi', async () => {
      const paidOrder = { ...mockOrderDoc, status: OrderStatus.PAID, paidAt: new Date() };
      mockOrderModel.findById.mockResolvedValue(paidOrder);

      const result = await service.confirmPayment(mockOrderId);

      expect(result.status).toBe(OrderStatus.PAID);
      // Đảm bảo KHÔNG gọi lại hàm tạo enrollment
      expect(mockEnrollmentsService.createEnrollment).not.toHaveBeenCalled();
    });

    it('từ chối xác nhận thanh toán (throw BadRequestException) khi Order ở trạng thái CANCELLED hoặc FAILED', async () => {
      const cancelledOrder = { ...mockOrderDoc, status: OrderStatus.CANCELLED };
      mockOrderModel.findById.mockResolvedValue(cancelledOrder);

      await expect(service.confirmPayment(mockOrderId)).rejects.toThrow(BadRequestException);
      expect(mockEnrollmentsService.createEnrollment).not.toHaveBeenCalled();
    });
  });
});
