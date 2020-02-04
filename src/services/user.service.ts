import { Injectable } from '@nestjs/common';
import { ConfigService } from '../modules/config/config.service';
import { UserController } from '../controllers/user.controller';
import { User } from '../types/user.types';
import { RestUserRepository } from '../repositories/user.repository';

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
