import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { CurrentUser } from '../auth/current-user.decorator';
import { AccessService } from './access.service';

@ApiTags('access')
@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('check/:courseId')
  @ApiOperation({
    summary: 'Kiểm tra quyền vào học của Học viên với 1 Khóa học (Computed Permission)',
  })
  async checkCourseAccess(
    @CurrentUser('userId') studentId: string,
    @Param('courseId', ParseObjectIdPipe) courseId: string,
  ): Promise<{ courseId: string; canAccess: boolean }> {
    const canAccess = await this.accessService.canAccessCourse(studentId, courseId);
    return { courseId, canAccess };
  }
}
