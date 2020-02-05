import { User } from '../types/user';
import { UserService } from '../services/user';
import { IResolvers } from 'apollo-server-express';

const resolvers = (userService: UserService): IResolvers => ({
    Query: {
        async getCurrentUser(_, args, context: { authScope: string }): Promise<User> {
            return await userService.getCurrentUser(context.authScope);
        },
    },
});

export const UserResolvers = resolvers;
