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
        async startSubmission(_, args): Promise<DtoViewSubmission | null> {
            return await submissionService.create(args.articleType);
        },

        async changeSubmissionTitle(id: string, title: string): Promise<DtoViewSubmission | null> {
            return await submissionService.changeTitle(SubmissionId.fromUuid(id), title);
        },

        async deleteSubmission(id: SubmissionId): Promise<boolean> {
            return await submissionService.delete(id);
        },
    },
});

export default resolvers;
