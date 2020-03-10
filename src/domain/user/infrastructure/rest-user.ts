import { InfraLogger as logger } from '../../../logger';
import { User, UserRepository } from '../user';
import fetch from 'node-fetch';

export class RestUserRepository implements UserRepository {
    constructor(userAdapterUrl: string) {
        this.userAdapterUrl = userAdapterUrl;
    }
    private readonly userAdapterUrl: string;

    public async getCurrentUser(header: string): Promise<User> {
        try {
            const response = await fetch(this.userAdapterUrl, {
                headers: [['authorization', header]],
            });
            const json = await response.json();
            return json;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
}
