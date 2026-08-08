import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

export const applyMiddleware = (app: INestApplication) => {
  app.use(helmet(), cookieParser());
};

// Helmet dùng để tăng bảo mật HTTP headers,
// cookie-parser dùng để đọc cookie từ request.
