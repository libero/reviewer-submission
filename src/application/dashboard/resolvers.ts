import { DashboardService } from './service';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';

const resolvers = (dashboard: DashboardService): IResolvers => ({
    Query: {
        async getSubmissions(): Promise<Submission[] | null> {
            return await dashboard.find();
        },
        async getSubmission(id: string): Promise<Submission | null> {
            return await dashboard.getSubmission(SubmissionId.fromUuid(id));
        },
    },
    Mutation: {
        async startSubmission(_, args: { articleType: string }, context): Promise<Submission | null> {
            return await dashboard.startSubmission(args.articleType, context.userId);
        },

        async deleteSubmission(_, { id }: { id: SubmissionId }): Promise<SubmissionId> {
            await dashboard.deleteSubmission(id);
            return id;
        },
    },
});

export const DashboardResolvers = resolvers;
