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
        async uploadSupportingFile(_, { id }: { id: SubmissionId, file: FileUpload }): Promise<Submission | null> {
            return wizard.uploadSupportingFile(id, )
        },
    },
});

export const WizardResolvers = resolvers;
