import { User } from '../types/user.types';
import { UserService } from '../services/user.service';

// TODO: type this
const resolvers = (userService: UserService): any => ({
    Query: {
        // TODO: expressify it
        async getCurrentUser(header: string): Promise<User> {
            return await userService.getCurrentUser(header);
        },
    },
});

export default resolvers;
