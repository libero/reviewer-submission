import { User } from '../user';
import { RestUserRepository } from '../infrastructure/rest-user';

export class UserService {
    restUserRepository: RestUserRepository;
    constructor(userAdapterUrl: string) {
        this.restUserRepository = new RestUserRepository(userAdapterUrl);
    }

    async getCurrentUser(header: string): Promise<User> {
        return this.restUserRepository.getCurrentUser(header);
    }
}
