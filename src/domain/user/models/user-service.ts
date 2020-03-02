import { User } from '../user';
import { RestUserRepository } from '../infrastructure/rest-user';

export class UserService {
    restUserRepository: RestUserRepository;
    constructor(userAdapterUrl: string) {
        this.restUserRepository = new RestUserRepository(userAdapterUrl);
    }

    async getCurrentUser(header: string): Promise<User> {
        const user = await this.restUserRepository.getCurrentUser(header);
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
