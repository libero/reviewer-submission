import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable} from '@nestjs/common';
import { JwtPayload } from './types';
import { jwtSecret } from './constants';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(jwtPayload: JwtPayload): Promise<any> {
    // NOTE: this currently always returns null - we don't have a way to query a user yet!
    const user = this.authService.validateUser(jwtPayload);

    if (! user ) {
      throw new Error();
    }

    return user;
  }

}
