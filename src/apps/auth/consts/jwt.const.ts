export enum JWTEnvs {
  JWT_SECRET = 'JWT_SECRET',
  RESET_TOKEN_SECRET = 'RESET_TOKEN_SECRET',
}

export enum JWTToken {
  ACCESS_TOKEN_EXPIRE_IN = '6h',
  REFRESH_TOKEN_EXPIRE_IN = '1d',
  RESET_TOKEN_EXPIRE_IN = '15m',
}

export enum TokenKeys {
  ACCESS_TOKEN_KEY = 'accessToken',
  REFRESH_TOKEN_KEY = 'refreshToken',
}
