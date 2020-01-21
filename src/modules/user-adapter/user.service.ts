import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { UserController } from '../../packages/user/user.controller';
import { User } from '../../packages/user/user.types';
import { RestUserRepository } from './user.repository';

@Injectable()
export class UserService {
    controller: UserController;

    constructor(config: ConfigService) {
        const repo = new RestUserRepository(config.getUserAdapterUrl());
        this.controller = new UserController(repo);
    }

    async getCurrentUser(header: string): Promise<User> {
        return this.controller.getCurrentUser(header);
    }
}
