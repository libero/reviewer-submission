import { InfraLogger as logger } from '../../../logger';
import { User, UserRepository, EditorAlias } from '../user';
import fetch from 'node-fetch';

export class RestUserRepository implements UserRepository {
    private readonly currentUser = '/current-user';
    private readonly editors = '/editors';

    constructor(userApiUrl: string) {
        this.userApiUrl = userApiUrl;
    }
    private readonly userApiUrl: string;

    public async getEditors(authHeader: string, role: string): Promise<EditorAlias[]> {
        return this.get(this.editors + `?role=${role}`, authHeader) as Promise<EditorAlias[]>;
    }

    public async getCurrentUser(authHeader: string): Promise<User> {
        return this.get(this.currentUser, authHeader) as Promise<User>;
    }

    private async get(path: string, authHeader = ''): Promise<unknown> {
        try {
            const opts = authHeader ? { headers: [['authorization', authHeader]] } : {};
            const response = await fetch(this.userApiUrl + path, opts);
            const json = await response.json();
            return json;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
}
