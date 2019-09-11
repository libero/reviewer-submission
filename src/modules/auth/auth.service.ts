// There's a chance things will need access to the auth module

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserIdentity } from 'auth-utils';

// TODO: Remove
export interface User {
  userId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) {}
  // - To look up the user from here, we need to inject the UserService
  // The input to this function needs to be the jwt token object
  async validateUser(tokenObj: UserIdentity): Promise<User | null> {
    // This needs something to look up the user id (some kind of auth service/users table etc)
    // This is a thing that's meant to get a user and return it
    return null;
  }
}
