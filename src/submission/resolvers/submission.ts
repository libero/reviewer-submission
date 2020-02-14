import { SubmissionService } from '../models/submission-service';
import { SubmissionId, DtoViewSubmission, Submission, Author } from '../submission';
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

        // TODO: this used to be just autosave, passing in the whole object or a subset.
        // It's likely that such a specific resolver is less ideal than a generic auto save route.
        // It was refactored to match reviwer mocks as much as possible
        async saveDetailsPage(_, { id, details }: { id: SubmissionId; details: Author }): Promise<Submission> {
            return await submissionService.saveDetailsPage(id, details);
        },
    },
});

export const SubmissionResolvers = resolvers;
