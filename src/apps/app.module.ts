import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CatchEverythingFilter } from 'src/common/catch-everything/catch-everything.filter';
import { LoggerModule } from 'src/common/logger/logger.module';
import { LoggingInterceptor } from 'src/common/logger/logging.interceptor';
import { ApiUtilModule } from 'src/common/utils/api-util/api-util.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    LoggerModule,
    ApiUtilModule,
  ],
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
