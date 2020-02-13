import { User } from '../user';
import { UserService } from '../models/user-service';
import { IResolvers } from 'apollo-server-express';

const resolvers = (userService: UserService): IResolvers => ({
    Query: {
        async getCurrentUser(_, args, context: { authorizationHeader: string }): Promise<User> {
            return await userService.getCurrentUser(context.authorizationHeader);
        },
    },
});

export const UserResolvers = resolvers;
