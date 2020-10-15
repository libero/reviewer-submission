import { DashboardService } from './service';
import Submission, { ArticleType } from '../../domain/submission/services/models/submission';
import { SubmissionId } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';
import { UserService } from '../../domain/user';
import { InfraLogger as logger } from '../../logger';
import { TeamService } from '../../domain/teams/services/team-service';

const resolvers = (dashboard: DashboardService, userService: UserService, teamService: TeamService): IResolvers => ({
    Query: {
        async getSubmissions(
            _,
            {}: {},
            context,
        ): Promise<Array<Omit<Submission, 'updated'> & { updated: string }> | null> {
            logger.info(`resolver: getSubmissions()`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await dashboard.findMySubmissions(user);
        },
    },
    Mutation: {
        async startSubmission(_, args: { articleType: string }, context): Promise<Submission | null> {
            logger.info(`resolver: startSubmission(${args.articleType})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            const submission = await dashboard.startSubmission(user, args.articleType);
            // less than ideal but fixes https://github.com/libero/reviewer/issues/1506
            await teamService.updateOrCreateAuthor(submission.id.toString(), {
                firstName: '',
                lastName: '',
                email: '',
                institution: '',
            });
            return submission;
        },
        async saveArticleType(_, args: { id: SubmissionId; articleType: string }, context): Promise<Submission | null> {
            logger.info(`resolver: saveArticleType(${args.id}, ${args.articleType})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await dashboard.saveArticleType(user, args.id, args.articleType as ArticleType);
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
