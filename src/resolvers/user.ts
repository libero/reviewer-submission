import { User } from '../types/user';
import { UserService } from '../services/user';
import { IResolvers } from 'apollo-server-express';

const resolvers = (userService: UserService): IResolvers => ({
    Query: {
        async getCurrentUser(header: string): Promise<User> {
            return await userService.getCurrentUser(header);
        },
    },
});

export const UserResolvers = resolvers;
