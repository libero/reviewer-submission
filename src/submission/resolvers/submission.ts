import { SubmissionService } from '../services/submission-service';
import Submission from '../services/models/submission';
import { SubmissionId } from '../types';
import { IResolvers } from 'apollo-server-express';

const resolvers = (submissionService: SubmissionService): IResolvers => ({
    Query: {
        async getSubmissions(): Promise<Submission[] | null> {
            return await submissionService.findAll();
        },
        async getSubmission(id: string): Promise<Submission | null> {
            return await submissionService.getSubmission(SubmissionId.fromUuid(id));
        },
    },
    Mutation: {
        async startSubmission(_, args: { articleType: string }, context): Promise<Submission | null> {
            return await submissionService.create(args.articleType, context.userId);
        },

        async changeSubmissionTitle(_, args: { id: string; title: string }): Promise<Submission | null> {
            return await submissionService.changeTitle(SubmissionId.fromUuid(args.id), args.title);
        },

        async deleteSubmission(_, { id }: { id: SubmissionId }): Promise<SubmissionId> {
            await submissionService.deleteSubmission(id);
            return id;
        },
    },
});

export const SubmissionResolvers = resolvers;
