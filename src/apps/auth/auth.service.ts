import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserCategoryRolesService } from '../user-category-roles/user-category-roles.service';
import { UserDocument, UserStatus } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { JWTEnvs, JWTToken, TokenKeys } from './consts/jwt.const';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { GoogleProfileDto } from './dto/google-profile.dto';
import { SignInDto, SignUpDto } from './dto/sign.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly userCategoryRolesService: UserCategoryRolesService,
    private readonly configService: ConfigService,
  ) {}

  async createTokens(user: UserDocument, categoryId?: string) {
    const userId = user._id.toString();
    const categoryPermissions = await this.userCategoryRolesService.getUserCategoryPermissions(
      userId,
      categoryId,
    );

    const payload = {
      userId,
      email: user.email,
      role: user.role,
      permissions: categoryPermissions,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(JWTEnvs.JWT_SECRET, 'default_secret'),
      expiresIn: JWTToken.ACCESS_TOKEN_EXPIRE_IN,
    });

    const refreshToken = await this.jwtService.signAsync(
      { userId: payload.userId },
      {
        secret: this.configService.get<string>(JWTEnvs.JWT_SECRET, 'default_secret'),
        expiresIn: JWTToken.REFRESH_TOKEN_EXPIRE_IN,
      },
    );

    return {
      [TokenKeys.ACCESS_TOKEN_KEY]: accessToken,
      [TokenKeys.REFRESH_TOKEN_KEY]: refreshToken,
    };
  }

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(JWTEnvs.JWT_SECRET, 'default_secret'),
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  async signUp(dto: SignUpDto): Promise<UserDocument> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException(`Email ${dto.email} already exists`);
    }

    return this.usersService.registerStudent(dto);
  }

  async signIn(dto: SignInDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please sign in using Google OAuth');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.createTokens(user);
    return { user, tokens };
  }

  async googleLogin(profile: GoogleProfileDto) {
    const user = await this.usersService.findOrCreateFromGoogle(profile);
    if (user.status !== UserStatus.ACTIVE || user.deletedAt) {
      throw new UnauthorizedException('Account is disabled');
    }

    const tokens = await this.createTokens(user);
    return { user, tokens };
  }

  async refreshToken(refreshToken: string) {
    const decoded = await this.verifyToken(refreshToken);
    const user = await this.usersService.findOne(decoded.userId);
    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.createTokens(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: 'If this account exists, a reset token has been generated.' };
    }

    const resetToken = await this.jwtService.signAsync(
      { userId: user._id.toString() },
      {
        secret: this.configService.get<string>(JWTEnvs.RESET_TOKEN_SECRET, 'reset_secret'),
        expiresIn: JWTToken.RESET_TOKEN_EXPIRE_IN,
      },
    );

    await this.usersService.setResetToken(user._id.toString(), resetToken);
    return {
      message: 'If this account exists, a reset token has been generated.',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(dto.token, {
        secret: this.configService.get<string>(JWTEnvs.RESET_TOKEN_SECRET, 'reset_secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByResetToken(dto.token);
    if (!user || user._id.toString() !== decoded.userId) {
      throw new UnauthorizedException('Reset token is invalid or already used');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.usersService.updatePassword(user._id.toString(), hashedPassword);

    return { message: 'Password reset successfully' };
  }
}
