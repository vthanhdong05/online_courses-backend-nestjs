import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AccessService } from './access.service';

describe('AccessService - Computed Permission Check', () => {
  let service: AccessService;

  const mockStudentId = '60d5ecb8b5c9c82b88b0e1a1';
  const mockCourseId = '60d5ecb8b5c9c82b88b0e1a0';

  const mockEnrollmentsService = {
    isEnrolled: jest.fn(),
  };

  const mockCoursesService = {
    findOne: jest.fn(),
  };

  const mockSubscriptionsService = {
    hasActiveSubscription: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessService,
        {
          provide: EnrollmentsService,
          useValue: mockEnrollmentsService,
        },
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    service = module.get<AccessService>(AccessService);
  });

  it('Case 1: Cho phép học nếu Học viên đã Mua lẻ (Enrollment = true)', async () => {
    mockEnrollmentsService.isEnrolled.mockResolvedValue(true);

    const result = await service.canAccessCourse(mockStudentId, mockCourseId);

    expect(result).toBe(true);
    expect(mockEnrollmentsService.isEnrolled).toHaveBeenCalledWith(mockStudentId, mockCourseId);
  });

  it('Case 2: Cho phép học nếu chưa mua lẻ NHƯNG Khóa học là VIP (includedInVip = true) VÀ có Gói VIP active', async () => {
    mockEnrollmentsService.isEnrolled.mockResolvedValue(false);
    mockCoursesService.findOne.mockResolvedValue({ id: mockCourseId, includedInVip: true });
    mockSubscriptionsService.hasActiveSubscription.mockResolvedValue(true);

    const result = await service.canAccessCourse(mockStudentId, mockCourseId);

    expect(result).toBe(true);
  });

  it('Case 3: Từ chối nếu Khóa học NẰM NGOÀI VIP (includedInVip = false) mặc dù Học viên đang có Gói VIP active', async () => {
    mockEnrollmentsService.isEnrolled.mockResolvedValue(false);
    mockCoursesService.findOne.mockResolvedValue({ id: mockCourseId, includedInVip: false });
    mockSubscriptionsService.hasActiveSubscription.mockResolvedValue(true);

    const result = await service.canAccessCourse(mockStudentId, mockCourseId);

    expect(result).toBe(false);
  });

  it('Case 4: Từ chối nếu không mua lẻ VÀ không có Gói VIP active', async () => {
    mockEnrollmentsService.isEnrolled.mockResolvedValue(false);
    mockCoursesService.findOne.mockResolvedValue({ id: mockCourseId, includedInVip: true });
    mockSubscriptionsService.hasActiveSubscription.mockResolvedValue(false);

    const result = await service.canAccessCourse(mockStudentId, mockCourseId);

    expect(result).toBe(false);
  });
});
