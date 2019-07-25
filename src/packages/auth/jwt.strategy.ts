import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable} from '@nestjs/common';
import { JwtPayload } from './types';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(jwtPayload: JwtPayload): Promise<any> {
    const user = this.authService.validateUser(jwtPayload);

    // This is from the example on nestjs
    // tslint:disable-next-line
    console.log('validate');
    if (! user ) {
      throw new Error();
    }

    return user;
  }

}
