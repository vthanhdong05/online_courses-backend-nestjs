import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { applyMiddleware } from './common/middleware/common.middleware';

const initOpenAPI = (app: INestApplication) => {
  const { APP_NAME } = process.env;
  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(`${APP_NAME} API`)
      .setDescription(`${APP_NAME} API description`)
      .setVersion('1.0.0')
      .build(),
  );

  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc));
};

const initApp = (app: INestApplication) => {
  const { APP_PREFIX = '/api', FE_URL } = process.env;
  app.setGlobalPrefix(APP_PREFIX);
  if (FE_URL) {
    app.enableCors({
      origin: FE_URL,
    });
  }
  applyMiddleware(app);
  initOpenAPI(app);

  return app;
};
export { initApp };
