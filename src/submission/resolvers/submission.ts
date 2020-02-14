import { SubmissionService } from '../models/submission-service';
import { SubmissionId, DtoViewSubmission, Submission } from '../submission';
import { IResolvers } from 'apollo-server-express';

const resolvers = (submissionService: SubmissionService): IResolvers => ({
    Query: {
        async getSubmissions(): Promise<DtoViewSubmission[] | null> {
            return await submissionService.findAll();
        },
        async getSubmission(id: string): Promise<DtoViewSubmission | null> {
            return await submissionService.findOne(SubmissionId.fromUuid(id));
        },
    },
    Mutation: {
        async startSubmission(_, args: { articleType: string }, context): Promise<DtoViewSubmission | null> {
            return await submissionService.create(args.articleType, context.userId);
        },

        async changeSubmissionTitle(_, args: { id: string; title: string }): Promise<DtoViewSubmission | null> {
            return await submissionService.changeTitle(SubmissionId.fromUuid(args.id), args.title);
        },

        async deleteSubmission(_, { id }: { id: SubmissionId }): Promise<SubmissionId> {
            await submissionService.delete(id);
            return id;
        },

        async autoSave(_, { submission }: { submission: Submission }): Promise<Submission> {
            return await submissionService.autoSave(submission);
        },
    },
});

export const SubmissionResolvers = resolvers;
