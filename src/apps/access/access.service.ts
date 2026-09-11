import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class AccessService {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    @Inject(forwardRef(() => CoursesService))
    private readonly coursesService: CoursesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Tính toán quyền truy cập khóa học động (Computed Permission Check)
   *
   * Công thức:
   * Có quyền học = Đã mua lẻ (Enrollment purchased)
   *               HOẶC (Course.includedInVip === true VÀ Có Subscription đang ACTIVE)
   */
  async canAccessCourse(studentId: string, courseId: string): Promise<boolean> {
    if (!studentId || !courseId) {
      return false;
    }

    // 1. Kiểm tra nếu học viên đã mua lẻ khóa học này
    const isEnrolled = await this.enrollmentsService.isEnrolled(studentId, courseId);
    if (isEnrolled) {
      return true;
    }

    // 2. Kiểm tra nếu khóa học nằm trong gói VIP VÀ Học viên đang có VIP active
    try {
      const course = await this.coursesService.findOne(courseId);
      if (course && course.includedInVip) {
        const hasVip = await this.subscriptionsService.hasActiveSubscription(studentId);
        if (hasVip) {
          return true;
        }
      }
    } catch {
      return false;
    }

    // 3. Không thỏa mãn điều kiện nào -> Không có quyền truy cập
    return false;
  }
}
