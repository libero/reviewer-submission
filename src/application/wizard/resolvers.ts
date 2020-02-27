import { IResolvers } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, Author } from '../../domain/submission/types';
import { WizardService } from './service';

const resolvers = (wizard: WizardService): IResolvers => ({
    Query: {},
    Mutation: {
        async saveDetailsPage(
            _,
            { id: submissionId, details }: { id: SubmissionId; details: Author },
            { userId },
        ): Promise<Submission | null> {
            return wizard.saveDetailsPage(submissionId, userId, details);
        },
        async uploadManuscript(
            _,
            variables: { file: FileUpload; fileSize: number; id: SubmissionId },
            { userId },
        ): Promise<null> {
            const { file, id: submissionId, fileSize } = variables;
            await wizard.saveManuscriptFile(submissionId, userId, file, fileSize);

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
