import { IResolvers, withFilter, PubSub } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import Submission from '../../domain/submission/services/models/submission';
import {
    SubmissionId,
    AuthorDetails,
    ManuscriptDetails,
    EditorDetails,
    DisclosureDetails,
} from '../../domain/submission/types';
import { UserService } from 'src/domain/user';
import { WizardService } from './service';
import { FileId } from '../../domain/file/types';
import File from '../../domain/file/services/models/file';
import { InfraLogger as logger } from '../../logger';
import { SurveyService } from '../../domain/survey/services/survey-service';
import { SurveyAnswer } from '../../domain/survey/services/models/survey-answer';
import { SurveyResponse } from '../../domain/survey/services/models/survey-response';

const pubsub = new PubSub();

const resolvers = (wizard: WizardService, userService: UserService, surveyService: SurveyService): IResolvers => ({
    Query: {
        async getSubmission(_, { id }: { id: SubmissionId }, context): Promise<Submission | null> {
            logger.info(`resolver: getSubmission(${id})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await wizard.getSubmission(user, id);
        },
    },
    Mutation: {
        async submit(_, { id: submissionId }: { id: SubmissionId }, context): Promise<Submission | null> {
            logger.info(`resolver: submit(${submissionId})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.submit(user, submissionId, context.ip);
        },
        async saveAuthorPage(
            _,
            { id: submissionId, details }: { id: SubmissionId; details: AuthorDetails },
            context,
        ): Promise<Submission | null> {
            logger.info(`resolver: saveAuthorPage(${submissionId})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveAuthorPage(user, submissionId, details);
        },

        async saveEditorPage(
            _,
            { id: submissionId, details }: { id: SubmissionId; details: EditorDetails },
            context,
        ): Promise<Submission | null> {
            logger.info(`resolver: saveEditorPage(${submissionId})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveEditorPage(user, submissionId, details);
        },
        async saveDisclosurePage(
            _,
            { id: submissionId, details }: { id: SubmissionId; details: DisclosureDetails },
            context,
        ): Promise<Submission | null> {
            logger.info(`resolver: saveDisclosurePage(${submissionId})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveDisclosurePage(user, submissionId, details);
        },
        async uploadManuscript(
            _,
            variables: { file: FileUpload; fileSize: number; id: SubmissionId },
            context,
        ): Promise<Submission> {
            const { file, id: submissionId, fileSize } = variables;
            logger.info(`resolver: uploadManuscript(${submissionId}, ${JSON.stringify(file)})`);
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
            logger.info(`resolver: deleteManuscript(${submissionId})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return await wizard.deleteManuscriptFile(fileId, submissionId, user);
        },
        async uploadSupportingFile(
            _,
            variables: { file: FileUpload; fileSize: number; id: SubmissionId },
            context,
        ): Promise<File> {
            const { file, id: submissionId, fileSize } = variables;
            logger.info(`resolver: uploadSupportingFile(${submissionId})`);
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
            logger.info(`resolver: deleteSupportingFile(${submissionId})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            const deletedFileId = await wizard.deleteSupportingFile(fileId, submissionId, user);
            return deletedFileId.toString();
        },
        async saveFilesPage(
            _,
            { id: submissionId, coverLetter }: { id: SubmissionId; coverLetter: string },
            context,
        ): Promise<Submission> {
            logger.info(`resolver: saveFilesPage(${submissionId})`);
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
            logger.info(`resolver: saveDetailsPage(${submissionId})`);
            const user = await userService.getCurrentUser(context.authorizationHeader);
            return wizard.saveDetailsPage(user, submissionId, details);
        },

        async submitSurveyResponse(
            _,
            args: { surveyId: string; submissionId: string; answers: SurveyAnswer[] },
        ): Promise<SurveyResponse> {
            const { surveyId, submissionId, answers } = args;
            logger.info(`resolver: submitSurveyResponse(${submissionId})`);
            const surveyResponse = await surveyService.submitResponse(
                surveyId,
                SubmissionId.fromUuid(submissionId),
                answers,
            );

            return surveyResponse;
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
