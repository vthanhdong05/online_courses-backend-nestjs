import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CatchEverythingFilter } from 'src/common/catch-everything/catch-everything.filter';
import { LoggingInterceptor } from 'src/common/logger/logging.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from 'src/common/logger/logger.module';
import { ApiUtilModule } from 'src/common/utils/api-util/api-util.module';

@Module({
  imports: [LoggerModule, ApiUtilModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
