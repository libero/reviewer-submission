import { IResolvers, withFilter, PubSub } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionId, Author } from '../../domain/submission/types';
import { UserService } from 'src/domain/user';
import { WizardService } from './service';
import { FileId } from '../../domain/file/types';

const pubsub = new PubSub();

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
            const submission = await wizard.saveManuscriptFile(user, submissionId, file, fileSize, pubsub);

            return submission;
        },
        async deleteManuscript(
            _,
            variables: { fileId: FileId; submissionId: SubmissionId },
            context,
        ): Promise<boolean> {
            await pubsub.publish('UPLOAD_STATUS', {
                userId: 'c0e64a86-2feb-435d-a40f-01f920334bc4',
                filename: 'name',
                fileId: '12',
                percentage: '10',
            });
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
            const submission = await wizard.saveSupportingFile(user, submissionId, file, fileSize, pubsub);

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
        async saveFilesPage(
            _,
            { id: submissionId, coverLetter }: { id: SubmissionId; coverLetter: string },
            context,
        ): Promise<Submission | null> {
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveFilesPage(user, submissionId, coverLetter);
        },
    },
    Subscription: {
        manuscriptUploadProgress: {
            subscribe: withFilter(
                () => pubsub.asyncIterator('UPLOAD_STATUS'),
                (payload, variables, context) => {
                    console.log('hahah');
                    if (payload.filename === variables.filename && payload.userId === context.userId) {
                        return payload.percentage;
                    }
                    return 0;
                },
            ),
        },
    },
});

export const WizardResolvers = resolvers;
