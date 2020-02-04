import { SubmissionService } from '../services/submission';
import { SubmissionId, DtoViewSubmission } from '../types/submission';
import { IResolvers } from 'apollo-server-express';

// TODO: type this
const resolvers = (submissionService: SubmissionService): IResolvers => ({
    Query: {
        async getSubmissions(): Promise<DtoViewSubmission[] | null> {
            const result = await submissionService.findAll();
            return result.getOrElse(null);
        },
        async getSubmission(id: string): Promise<DtoViewSubmission | null> {
            const result = await submissionService.findOne(SubmissionId.fromUuid(id));
            if (result.isEmpty()) {
                return null;
            } else {
                return result.get();
            }
        },
    },
    Mutation: {
        async startSubmission(_, args): Promise<DtoViewSubmission | null> {
            console.log('article type', args.articleType);
            const result = await submissionService.create(args.articleType);
            return result.getOrElse(null);
        },

        async changeSubmissionTitle(id: string, title: string): Promise<DtoViewSubmission | null> {
            const result = await this.submissionService.changeTitle(SubmissionId.fromUuid(id), title);
            return result.getOrElse(null);
        },

        async deleteSubmission(id: SubmissionId): Promise<number> {
            return await this.submissionService.delete(id);
        },
    },
});

export default resolvers;
