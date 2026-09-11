import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách các khóa học Học viên đã đăng ký / sở hữu' })
  async findMyEnrollments(
    @CurrentUser('userId') studentId: string,
  ): Promise<EnrollmentResponseDto[]> {
    const enrollments = await this.enrollmentsService.findByStudentId(studentId);
    return EnrollmentResponseDto.fromDocuments(enrollments);
  }
}
