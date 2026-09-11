import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleProfileDto } from '../dto/google-profile.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', 'placeholder_client_id'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', 'placeholder_client_secret'),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:9999/api/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): any {
    const { id, displayName, emails, photos } = profile;
    const googleUser: GoogleProfileDto = {
      googleId: id,
      email: emails?.[0]?.value || '',
      fullName: displayName,
      avatar: photos?.[0]?.value,
    };
    done(null, googleUser);
    return googleUser;
  }
}
