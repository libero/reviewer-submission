import { WizardService } from './service';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, Author } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';

const resolvers = (wizard: WizardService): IResolvers => ({
    Query: {},
    Mutation: {
        async saveDetailsPage(_, { id, details }: { id: SubmissionId; details: Author }): Promise<Submission | null> {
            return wizard.saveDetailsPage(id, details);
        },
    },
});

export const WizardResolvers = resolvers;
