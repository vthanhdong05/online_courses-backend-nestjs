import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Cookies } from '../../common/decorators/cookies.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { SkipAuth } from './auth.decorator';
import { AuthService } from './auth.service';
import { COOKIE_CONFIG_DEFAULT } from './consts/cookie.const';
import { TokenKeys } from './consts/jwt.const';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { SignInDto, SignUpDto } from './dto/sign.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setTokenCookies(res: Response, tokens: Record<string, string>) {
    res.cookie(
      TokenKeys.ACCESS_TOKEN_KEY,
      tokens[TokenKeys.ACCESS_TOKEN_KEY],
      COOKIE_CONFIG_DEFAULT,
    );
    res.cookie(
      TokenKeys.REFRESH_TOKEN_KEY,
      tokens[TokenKeys.REFRESH_TOKEN_KEY],
      COOKIE_CONFIG_DEFAULT,
    );
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie(TokenKeys.ACCESS_TOKEN_KEY, COOKIE_CONFIG_DEFAULT);
    res.clearCookie(TokenKeys.REFRESH_TOKEN_KEY, COOKIE_CONFIG_DEFAULT);
  }

  @SkipAuth()
  @Post('sign-up')
  @ApiOperation({ summary: 'Đăng ký tài khoản Học viên (Student)' })
  async signUp(@Body() dto: SignUpDto): Promise<UserResponseDto> {
    const user = await this.authService.signUp(dto);
    return UserResponseDto.fromDocument(user);
  }

  @SkipAuth()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng Email & Password' })
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.signIn(dto);
    this.setTokenCookies(res, tokens);
    return {
      user: UserResponseDto.fromDocument(user),
      tokens,
    };
  }

  @SkipAuth()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Đăng nhập bằng Google OAuth2' })
  async googleAuth() {
    // Handled by GoogleAuthGuard
  }

  @SkipAuth()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth2 Callback Handler' })
  async googleAuthCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const googleUser = req.user as GoogleProfileDto;
    const { user, tokens } = await this.authService.googleLogin(googleUser);
    this.setTokenCookies(res, tokens);
    return {
      user: UserResponseDto.fromDocument(user),
      tokens,
    };
  }

  @SkipAuth()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cấp lại Access Token mới bằng Refresh Token' })
  async refreshToken(
    @Cookies(TokenKeys.REFRESH_TOKEN_KEY) cookieRefreshToken: string,
    @Body('refreshToken') bodyRefreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = cookieRefreshToken || bodyRefreshToken;
    const tokens = await this.authService.refreshToken(refreshToken);
    this.setTokenCookies(res, tokens);
    return { tokens };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất, xóa HTTP-Only Cookies' })
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearTokenCookies(res);
    return { message: 'Logged out successfully' };
  }

  @SkipAuth()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gửi yêu cầu quên mật khẩu' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @SkipAuth()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu với reset token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
