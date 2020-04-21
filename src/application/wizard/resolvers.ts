import { IResolvers, withFilter, PubSub } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, AuthorDetails, ManuscriptDetails } from '../../domain/submission/types';
import { UserService } from 'src/domain/user';
import { WizardService } from './service';
import { FileId } from '../../domain/file/types';
import File from '../../domain/file/services/models/file';

const pubsub = new PubSub();

const resolvers = (wizard: WizardService, userService: UserService): IResolvers => ({
    Query: {
        async getSubmission(_, { id }: { id: SubmissionId }, context): Promise<Submission | null> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await wizard.getSubmission(user, id);
        },
    },
    Mutation: {
        async submit(_, { id: submissionId }: { id: SubmissionId }, context): Promise<Submission | null> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.submit(user, submissionId);
        },
        async saveAuthorPage(
            _,
            { id: submissionId, details }: { id: SubmissionId; details: AuthorDetails },
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
            const submission = await wizard.saveManuscriptFile(user, submissionId, file, fileSize, pubsub);

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
        ): Promise<File> {
            const { file, id: submissionId, fileSize } = variables;
            const user = await userService.getCurrentUser(context.authorizationHeader);
            const supportingFile = await wizard.saveSupportingFile(user, submissionId, file, fileSize, pubsub);

            return supportingFile;
        },
        async deleteSupportingFile(
            _,
            variables: { fileId: FileId; submissionId: SubmissionId },
            context,
        ): Promise<string> {
            const { fileId, submissionId } = variables;
            const user = await userService.getCurrentUser(context.authorizationHeader);
            const deletedFileId = await wizard.deleteSupportingFile(fileId, submissionId, user);
            return deletedFileId.value;
        },
        async saveFilesPage(
            _,
            { id: submissionId, coverLetter }: { id: SubmissionId; coverLetter: string },
            context,
        ): Promise<Submission> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await wizard.saveFilesPage(user, submissionId, coverLetter);
        },

        async saveDetailsPage(
            _,
            {
                id: submissionId,
                details,
            }: {
                id: SubmissionId;
                details: ManuscriptDetails;
            },
            context,
        ): Promise<Submission> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveDetailsPage(user, submissionId, details);
        },
    },
    Subscription: {
        fileUploadProgress: {
            subscribe: withFilter(
                () => pubsub.asyncIterator('UPLOAD_STATUS'),
                (payload, variables, context) => {
                    return (
                        payload.fileUploadProgress.userId === context.userId &&
                        payload.fileUploadProgress.submissionId === variables.submissionId
                    );
                },
            ),
        },
    },
});

export const WizardResolvers = resolvers;
