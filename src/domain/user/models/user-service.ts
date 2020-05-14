import { User } from '../user';
import { RestUserRepository } from '../infrastructure/rest-user';

export class UserService {
    userApiGetCurrentUser: RestUserRepository;
    constructor(userAdapterUrl: string) {
        this.userApiGetCurrentUser = new RestUserRepository(userAdapterUrl + '/current-user');
    }

    async getCurrentUser(header: string): Promise<User> {
        const user = await this.userApiGetCurrentUser.getCurrentUser(header);
        switch (user.role) {
            case 'executive':
                user.role = 'staff';
                break;
            default:
                user.role = 'user';
        }
        return user;
    }
}
