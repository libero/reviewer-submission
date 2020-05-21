import { User, EditorAlias } from '../user';
import { RestUserRepository } from '../infrastructure/rest-user';

export class UserService {
    userApi: RestUserRepository;
    constructor(userAdapterUrl: string) {
        this.userApi = new RestUserRepository(userAdapterUrl);
    }

    async getCurrentUser(header: string): Promise<User> {
        return await this.userApi.getCurrentUser(header);
    }

    async getEditors(header: string, role: string): Promise<EditorAlias[]> {
        return this.userApi.getEditors(header, role);
    }
}
