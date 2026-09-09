import { CookieOptions } from 'express';

export const COOKIE_CONFIG_DEFAULT: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};
