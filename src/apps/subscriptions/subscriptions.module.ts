import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionPlansModule } from '../subscription-plans/subscription-plans.module';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { SubscriptionCronService } from './services/subscription-cron.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
    SubscriptionPlansModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionCronService],
  exports: [SubscriptionsService, MongooseModule],
})
export class SubscriptionsModule {}
