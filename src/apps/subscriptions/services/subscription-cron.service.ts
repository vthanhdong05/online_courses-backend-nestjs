import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSubscriptionExpirationCron() {
    this.logger.debug('Bắt đầu chạy CronJob kiểm tra gói VIP hết hạn...');
    try {
      const expiredCount = await this.subscriptionsService.expireSubscriptions();
      this.logger.debug(`CronJob hoàn tất: ${expiredCount} gói VIP đã hết hạn.`);
    } catch (err: any) {
      this.logger.error(`Lỗi khi chạy CronJob quét gói VIP hết hạn: ${err.message}`, err.stack);
    }
  }
}
