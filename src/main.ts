import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/app.module';
import { LoggerModule } from './common/logger/logger.module';
import { initApp } from './init';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: LoggerModule.createLogger(),
  });

  initApp(app);

  await app.listen(process.env.PORT ?? 3000);

  Logger.log(`Service is running`);
}
void bootstrap();
