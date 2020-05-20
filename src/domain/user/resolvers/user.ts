import { User, EditorAlias } from '../user';
import { UserService } from '../models/user-service';
import { IResolvers } from 'apollo-server-express';

const resolvers = (userService: UserService): IResolvers => ({
    Query: {
        async getCurrentUser(_, args, context: { authorizationHeader: string }): Promise<User> {
            return await userService.getCurrentUser(context.authorizationHeader);
        },
        async getEditors(_, args: { role: string }, context: { authorizationHeader: string }): Promise<EditorAlias[]> {
            return await userService.getEditors(context.authorizationHeader, args.role);
        },
    },
});

export const UserResolvers = resolvers;
