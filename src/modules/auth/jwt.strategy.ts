import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable} from '@nestjs/common';
import { jwtSecret } from './constants';
import { AuthService } from './auth.service';
import { UserIdentity } from '@libero/auth-utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // The user type is as yet unknown
  async validate(jwtPayload: UserIdentity): Promise<unknown> {
    // NOTE: this currently always returns null - we don't have a way to query a user yet!
    const user = this.authService.validateUser(jwtPayload);

    if (! user ) {
      throw new Error();
    }

    return user;
  }

}
