import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { EnrollmentModel } from './schemas/enrollment.schema';
import { AccessType, Enrollment, EnrollmentDocument } from './schemas/enrollment.schema';

@Injectable()
export class EnrollmentsService {
  constructor(@InjectModel(Enrollment.name) private readonly enrollmentModel: EnrollmentModel) {}

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(studentId) || !Types.ObjectId.isValid(courseId)) {
      return false;
    }
    const count = await this.enrollmentModel.countDocuments({
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
    });
    return count > 0;
  }

  async createEnrollment(
    studentId: string,
    courseId: string,
    accessType: AccessType = AccessType.PURCHASED,
    orderId?: string,
  ): Promise<EnrollmentDocument> {
    try {
      const created = new this.enrollmentModel({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        accessType,
        orderId: orderId ? new Types.ObjectId(orderId) : null,
        enrolledAt: new Date(),
      });
      return await created.save();
    } catch (err: any) {
      // Handle MongoDB E11000 duplicate key error idempotently
      if (err.code === 11000) {
        const existing = await this.enrollmentModel.findOne({
          studentId: new Types.ObjectId(studentId),
          courseId: new Types.ObjectId(courseId),
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async findByStudentId(studentId: string): Promise<EnrollmentDocument[]> {
    return this.enrollmentModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('courseId')
      .sort({ enrolledAt: -1 })
      .exec();
  }
}
