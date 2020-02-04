import { Logger } from '@nestjs/common';
import { User, UserRepository } from '../types/user';
import fetch from 'node-fetch';

export class RestUserRepository implements UserRepository {
    constructor(userAdapterUrl: string) {
        this.userAdapterUrl = userAdapterUrl;
    }
    private readonly userAdapterUrl: string;
    private readonly logger = new Logger(RestUserRepository.name);

    public async getCurrentUser(header: string): Promise<User> {
        try {
            const response = await fetch(this.userAdapterUrl, {
                headers: [['authorization', header]],
            });
            return await response.json();
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}
