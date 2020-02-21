import { DashboardService } from './dashboard-service';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';

// TODO: move this out once work on this ticket start https://github.com/libero/reviewer-submission/issues/79
export interface Person {
    firstName: string;
    lastName: string;
    email: string;
    institution: string;
}

export type Author = Person;

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

        // stub pending - move to autosave service
        async saveDetailsPage(_, { id, details }: { id: SubmissionId; details: Author }): Promise<Submission | null> {
            // TODO: stub for now
            return null;
        },
    },
});

export const DashboardResolvers = resolvers;
