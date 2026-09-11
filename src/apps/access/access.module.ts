import { forwardRef, Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';

@Module({
  imports: [forwardRef(() => CoursesModule), EnrollmentsModule, SubscriptionsModule],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
