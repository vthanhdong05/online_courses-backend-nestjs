import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CourseStatus } from '../courses/schemas/course.schema';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { AccessType } from '../enrollments/schemas/enrollment.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import type { OrderModel } from './schemas/order.schema';
import { Order, OrderDocument, OrderStatus, OrderType } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: OrderModel,
    private readonly coursesService: CoursesService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async create(studentId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException(`Student ID không hợp lệ: ${studentId}`);
    }

    const course = await this.coursesService.findOne(dto.courseId);

    // Business Rule 1: Course phải ở trạng thái PUBLISHED
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException(
        `Khóa học "${course.title}" đang ở trạng thái ${course.status}. Chỉ cho phép mua khóa học đã xuất bản (published)`,
      );
    }

    // Business Rule 2: Student chưa có Enrollment active cho course đó (tránh mua trùng)
    const isEnrolled = await this.enrollmentsService.isEnrolled(studentId, dto.courseId);
    if (isEnrolled) {
      throw new BadRequestException(
        'Học viên đã đăng ký khóa học này rồi, không thể tạo thêm đơn mua mới',
      );
    }

    // Business Rule 3: amount lấy trực tiếp từ course.price trong DB (chống sửa giá client)
    const created = new this.orderModel({
      studentId: new Types.ObjectId(studentId),
      type: OrderType.COURSE,
      courseId: new Types.ObjectId(dto.courseId),
      amount: course.price,
      status: OrderStatus.PENDING,
    });

    return created.save();
  }

  async confirmPayment(orderId: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException(`Invalid Order ID: ${orderId}`);
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    // Idempotent Check: Nếu đơn đã PAID rồi -> trả về ngay kết quả hiện tại, không lỗi, không tạo Enrollment lần 2
    if (order.status === OrderStatus.PAID) {
      return order;
    }

    // Nếu đơn bị hủy/thất bại -> reject
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.FAILED) {
      throw new BadRequestException(
        `Đơn hàng ${orderId} đã ở trạng thái ${order.status}, không thể xác nhận thanh toán`,
      );
    }

    // Chuyển status = PAID, paidAt = now
    order.status = OrderStatus.PAID;
    order.paidAt = new Date();
    const savedOrder = await order.save();

    // Nối Order -> Enrollment
    if (order.type === OrderType.COURSE && order.courseId) {
      await this.enrollmentsService.createEnrollment(
        order.studentId.toString(),
        order.courseId.toString(),
        AccessType.PURCHASED,
        order._id.toString(),
      );
    }

    return savedOrder;
  }

  async cancelOrder(orderId: string): Promise<OrderDocument> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException(`Invalid Order ID: ${orderId}`);
    }

    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Đơn hàng đã thanh toán không thể hủy');
    }

    order.status = OrderStatus.CANCELLED;
    return order.save();
  }

  async findByStudentId(studentId: string): Promise<OrderDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      return [];
    }
    return this.orderModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('courseId')
      .sort({ createdAt: -1 })
      .exec();
  }
}
