import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin / lịch sử đăng ký VIP của Học viên đang đăng nhập' })
  async findMySubscriptions(
    @CurrentUser('userId') studentId: string,
  ): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.subscriptionsService.findByStudentId(studentId);
    return SubscriptionResponseDto.fromDocuments(subscriptions);
  }
}
