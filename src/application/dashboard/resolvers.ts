import { DashboardService } from './service';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';
import { UserService } from 'src/domain/user';
import { InfraLogger as logger } from '../../logger';

const resolvers = (dashboard: DashboardService, userService: UserService): IResolvers => ({
    Query: {
        async getSubmissions(_, {}: {}, context): Promise<Submission[] | null> {
            logger.info(`resolver: getSubmissions()`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await dashboard.findMySubmissions(user);
        },
    },
    Mutation: {
        async startSubmission(_, args: { articleType: string }, context): Promise<Submission | null> {
            logger.info(`resolver: startSubmission(${args.articleType})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await dashboard.startSubmission(user, args.articleType);
        },

        async deleteSubmission(_, { id }: { id: SubmissionId }, context): Promise<SubmissionId> {
            logger.info(`resolver: deleteSubmission(${id})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            await dashboard.deleteSubmission(user, id);
            return id;
        },
    },
});

export const DashboardResolvers = resolvers;
