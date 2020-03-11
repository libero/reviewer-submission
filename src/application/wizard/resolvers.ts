import { IResolvers } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, Author } from '../../domain/submission/types';
import { UserService } from 'src/domain/user';
import { WizardService } from './service';
import { FileId } from '../../domain/file/types';

const resolvers = (wizard: WizardService, userService: UserService): IResolvers => ({
    Query: {},
    Mutation: {
        async saveAuthorPage(
            _,
            { id: submissionId, details }: { id: SubmissionId; details: Author },
            context,
        ): Promise<Submission | null> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveAuthorPage(user, submissionId, details);
        },
        async uploadManuscript(
            _,
            variables: { file: FileUpload; fileSize: number; id: SubmissionId },
            context,
        ): Promise<Submission> {
            const { file, id: submissionId, fileSize } = variables;
            const user = await userService.getCurrentUser(context.authorizationHeader);
            const submission = await wizard.saveManuscriptFile(user, submissionId, file, fileSize);

            return submission;
        },
        // @todo: swap to user once reviewer mocks can handle more than one user.
        async deleteManuscript(
            _,
            variables: { fileId: FileId; submissionId: SubmissionId },
            context,
        ): Promise<boolean> {
            const { fileId, submissionId } = variables;
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await wizard.deleteManuscriptFile(fileId, submissionId, user);
        },
    },
});

export const WizardResolvers = resolvers;
