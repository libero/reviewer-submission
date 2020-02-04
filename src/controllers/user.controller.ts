import { User, UserRepository } from '../types/user';
import { Controller } from '@nestjs/common';

@Controller('User')
export class UserController {
    constructor(readonly repository: UserRepository) {}

    async getCurrentUser(authHeader: string): Promise<User> {
        return await this.repository.getCurrentUser(authHeader);
    }
}
