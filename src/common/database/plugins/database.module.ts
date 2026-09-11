import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { auditSoftDeletePlugin } from './audit-soft-delete.plugin';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
        connectionFactory: (connection) => {
          // Đăng ký 1 lần, áp dụng cho mọi schema đăng ký sau này trên connection này
          connection.plugin(auditSoftDeletePlugin);
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
