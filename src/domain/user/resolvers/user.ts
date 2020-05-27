import { User, EditorAlias } from '../user';
import { UserService } from '../models/user-service';
import { IResolvers } from 'apollo-server-express';
import { InfraLogger as logger } from '../../../logger';

const resolvers = (userService: UserService): IResolvers => ({
    Query: {
        async getCurrentUser(_, args, context: { authorizationHeader: string }): Promise<User> {
            logger.info(`resolver: getCurrentUser()`);
            return await userService.getCurrentUser(context.authorizationHeader);
        },
        async getEditors(_, args: { role: string }, context: { authorizationHeader: string }): Promise<EditorAlias[]> {
            logger.info(`resolver: getEditors(${args.role})`);
            return await userService.getEditors(context.authorizationHeader, args.role);
        },
    },
});

export const UserResolvers = resolvers;
