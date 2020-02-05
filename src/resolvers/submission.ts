import { SubmissionService } from '../services/submission';
import { SubmissionId, DtoViewSubmission } from '../types/submission';
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
        async startSubmission(_, args: { articleType: string }): Promise<DtoViewSubmission | null> {
            return await submissionService.create(args.articleType);
        },

        async changeSubmissionTitle(_, args: { id: string; title: string }): Promise<DtoViewSubmission | null> {
            return await submissionService.changeTitle(SubmissionId.fromUuid(args.id), args.title);
        },

        async deleteSubmission(_, args: { id: SubmissionId }): Promise<boolean> {
            return await submissionService.delete(args.id);
        },
    },
});

export const SubmissionResolvers = resolvers;
