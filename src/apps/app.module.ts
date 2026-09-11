import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CatchEverythingFilter } from 'src/common/catch-everything/catch-everything.filter';
import { DatabaseModule } from 'src/common/database/plugins/database.module';
import { FormatResponseInterceptor } from 'src/common/interceptors/format-response/format-response.interceptor';
import { LoggerModule } from 'src/common/logger/logger.module';
import { LoggingInterceptor } from 'src/common/logger/logging.interceptor';
import { ApiUtilModule } from 'src/common/utils/api-util/api-util.module';
import { ExcelUtilModule } from 'src/common/utils/excel-util/excel-util.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessModule } from './access/access.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { InstructorsModule } from './instructors/instructors.module';
import { LessonsModule } from './lessons/lessons.module';
import { OrdersModule } from './orders/orders.module';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UserCategoryRolesModule } from './user-category-roles/user-category-roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    LoggerModule,
    ApiUtilModule,
    DatabaseModule,
    ExcelUtilModule,
    UsersModule,
    CategoriesModule,
    InstructorsModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    OrdersModule,
    SubscriptionPlansModule,
    SubscriptionsModule,
    AccessModule,
    UserCategoryRolesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FormatResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
