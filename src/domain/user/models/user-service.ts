import { User, EditorAlias } from '../user';
import { RestUserRepository } from '../infrastructure/rest-user';

export class UserService {
    userApi: RestUserRepository;
    constructor(userAdapterUrl: string) {
        this.userApi = new RestUserRepository(userAdapterUrl);
    }

    async getCurrentUser(header: string): Promise<User> {
        const user = await this.userApi.getCurrentUser(header);
        switch (user.role) {
            case 'executive':
                user.role = 'staff';
                break;
            default:
                user.role = 'user';
        }
        return user;
    }

    async getEditors(role: string): Promise<EditorAlias[]> {
        // query /people off continuum -> via continuum-adaptor
        return [];
    }
}
