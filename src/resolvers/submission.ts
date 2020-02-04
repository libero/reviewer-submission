import { SubmissionService } from '../services/submission';
import { SubmissionId, DtoViewSubmission } from '../types/submission';

// TODO: type this
const resolvers = (submissionService: SubmissionService): any => ({
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
        async startSubmission(articleType: string): Promise<DtoViewSubmission | null> {
            const result = await submissionService.create(articleType);
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
