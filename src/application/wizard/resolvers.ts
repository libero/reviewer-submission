import { WizardService } from './service';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, Author } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';

const resolvers = (wizard: WizardService): IResolvers => ({
    Query: {},
    Mutation: {
        async saveDetailsPage(_, { id, details }: { id: SubmissionId; details: Author }): Promise<Submission | null> {
            return wizard.saveDetailsPage(id, details);
        },
        async uploadManuscript(_, variables: { file: FileUpload; id: SubmissionId }, context): Promise<null> {
            const { file, id: submissionId } = variables;
            const userId = context.userId;
            return null;
        },
        async uploadSupportingFile(_, variables: { file: FileUpload; id: SubmissionId }, context): Promise<null> {
            const { file, id: submissionId } = variables;
            const userId = context.userId;
            return null;
        },
    },
});

export const WizardResolvers = resolvers;
