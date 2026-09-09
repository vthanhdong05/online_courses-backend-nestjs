import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthTokensDto {
  accessToken!: string;
  refreshToken!: string;
}

export class AuthResponseDto {
  user!: UserResponseDto;
  tokens!: AuthTokensDto;
}
