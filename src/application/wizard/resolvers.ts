import { WizardService } from './service';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, Author } from '../../domain/submission/types';
import { IResolvers } from 'apollo-server-express';
import { UserService } from 'src/domain/user';

const resolvers = (wizard: WizardService, userService: UserService): IResolvers => ({
    Query: {},
    Mutation: {
        async saveDetailsPage(
            _,
            { id, details }: { id: SubmissionId; details: Author },
            context,
        ): Promise<Submission | null> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveDetailsPage(user, id, details);
        },
    },
});

export const WizardResolvers = resolvers;
