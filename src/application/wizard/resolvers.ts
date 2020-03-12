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
        async saveDetailsPage(
            _,
            { id: submissionId, details }: { id: SubmissionId; details: Author },
            context,
        ): Promise<Submission | null> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveDetailsPage(user, submissionId, details);
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
        async deleteManuscript(
            _,
            variables: { fileId: FileId; submissionId: SubmissionId },
            context,
        ): Promise<boolean> {
            const { fileId, submissionId } = variables;
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await wizard.deleteManuscriptFile(fileId, submissionId, user);
        },
        async uploadSupportingFile(
            _,
            variables: { file: FileUpload; fileSize: number; id: SubmissionId },
            context,
        ): Promise<Submission> {
            const { file, id: submissionId, fileSize } = variables;
            const user = await userService.getCurrentUser(context.authorizationHeader);
            const submission = await wizard.saveSupportingFile(user, submissionId, file, fileSize);

            return submission;
        },
        async deleteSupportingFile(
            _,
            variables: { fileId: FileId; submissionId: SubmissionId },
            context,
        ): Promise<boolean> {
            const { fileId, submissionId } = variables;
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await wizard.deleteSupportingFile(fileId, submissionId, user);
        },
    },
});

export const WizardResolvers = resolvers;
