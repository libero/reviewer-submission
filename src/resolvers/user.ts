import { User } from '../types/user';
import { UserService } from '../services/user';
import { IResolvers } from 'apollo-server-express';

// TODO: type this
const resolvers = (userService: UserService): IResolvers => ({
    Query: {
        // TODO: expressify it
        async getCurrentUser(header: string): Promise<User> {
            return await userService.getCurrentUser(header);
        },
    },
});

export default resolvers;
