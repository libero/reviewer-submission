import { FileUpload } from 'graphql-upload';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { FileService } from '../../domain/file/services/file-service';
import { SemanticExtractionService } from '../../domain/semantic-extraction/services/semantic-extraction-service';
import { AuthorDetails, SubmissionId, ManuscriptDetails, PeopleDetails } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { AuthorTeamMember, PeopleTeamMember, PeopleReviewerTeamMember } from '../../domain/teams/repositories/types';
import { PermissionService, SubmissionOperation } from '../permission/service';
import { User } from 'src/domain/user/user';
import { FileType, FileId } from '../../domain/file/types';
import { PubSub } from 'apollo-server-express';
import { Config } from '../../config';
import { InfraLogger as logger } from '../../logger';
import File from '../../domain/file/services/models/file';

interface TeamData {
    peopleDetails: {
        suggestedSeniorEditors?: Array<string>;
        opposedSeniorEditors?: Array<string>;
        suggestedReviewingEditor?: Array<string>;
        opposedReviewingEditors?: Array<string>;
        opposedReviewer?: Array<{ name: string; email: string }>;
        suggestedReviewers?: Array<{ name: string; email: string }>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    author?: AuthorDetails;
}

export class WizardService {
    constructor(
        private readonly permissionService: PermissionService,
        private readonly submissionService: SubmissionService,
        private readonly teamService: TeamService,
        private readonly fileService: FileService,
        private readonly semanticExtractionService: SemanticExtractionService,
        private readonly config: Config,
    ) {}

    async getSubmission(user: User, submissionId: SubmissionId): Promise<Submission | null> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }
        return this.getFullSubmission(submissionId);
    }

    async saveAuthorPage(user: User, submissionId: SubmissionId, details: AuthorDetails): Promise<Submission | null> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }

        const team = await this.teamService.find(submissionId.toString(), 'author');
        const teamMembers: Array<AuthorTeamMember> = [
            {
                alias: details,
                meta: { corresponding: true },
            },
        ];
        if (team) {
            await this.teamService.update({
                ...team,
                teamMembers,
            });
        } else {
            await this.teamService.createAuthor('author', teamMembers, submissionId.toString(), 'manuscript');
        }

        return this.getFullSubmission(submissionId);
    }

    async savePeoplePage(user: User, submissionId: SubmissionId, details: PeopleDetails): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }

        console.log('ubmissionId.toString()', submissionId.toString());

        await this.teamService.addOrUpdatePeopleTeams(submissionId.toString(), details);

        await this.submissionService.addEditorDetails(
            submissionId,
            details.opposedReviewersReason,
            details.opposedReviewingEditorsReason,
            details.opposedSeniorEditorsReason,
        );

        return this.getFullSubmission(submissionId);
    }

    async submit(user: User, submissionId: SubmissionId): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to submit');
        }

        this.submissionService.submit(submissionId);

        return this.getFullSubmission(submissionId);
    }

    async deleteManuscriptFile(fileId: FileId, submissionId: SubmissionId, user: User): Promise<boolean> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.DELETE, submission);
        if (!allowed) {
            throw new Error('User not allowed to delete files');
        }
        return await this.fileService.deleteManuscript(fileId, submissionId);
    }

    async saveManuscriptFile(
        user: User,
        submissionId: SubmissionId,
        file: FileUpload,
        fileSize: number,
        pubsub: PubSub,
    ): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }
        if (fileSize > this.config.max_file_size_in_bytes) {
            throw new Error(`File truncated as it exceeds the ${this.config.max_file_size_in_bytes} byte size limit.`);
        }
        const { filename, mimetype: mimeType, createReadStream } = await file;
        const stream = createReadStream();
        const manuscriptFile = await this.fileService.create(
            submissionId,
            filename,
            mimeType,
            fileSize,
            FileType.MANUSCRIPT_SOURCE,
        );

        try {
            const fileContents = await this.fileService.uploadManuscript(
                manuscriptFile,
                stream,
                user.id,
                pubsub,
                submissionId,
            );
            await this.semanticExtractionService.extractTitle(fileContents, mimeType, filename, submissionId);
        } catch (e) {
            logger.error(submissionId, 'MANUSCRIPT UPLOAD ERROR', e);
            manuscriptFile.setStatusToCancelled();
            await this.fileService.update(manuscriptFile);
            throw new Error('Manuscript upload failed to store file.');
        }

        manuscriptFile.setStatusToStored();
        await this.fileService.update(manuscriptFile);

        return this.getFullSubmission(submissionId);
    }

    async saveSupportingFile(
        user: User,
        submissionId: SubmissionId,
        file: FileUpload,
        fileSize: number,
        pubsub: PubSub,
    ): Promise<File> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }
        if (fileSize > this.config.max_file_size_in_bytes) {
            throw new Error(`File truncated as it exceeds the ${this.config.max_file_size_in_bytes} byte size limit.`);
        }
        const { filename, mimetype: mimeType, createReadStream } = await file;
        const stream = createReadStream();
        const supportingFile = await this.fileService.create(
            submissionId,
            filename,
            mimeType,
            fileSize,
            FileType.SUPPORTING_FILE,
        );

        try {
            await this.fileService.uploadSupportingFile(supportingFile, stream, user.id, pubsub, submissionId);
        } catch (e) {
            logger.error(submissionId, 'SUPPORTING UPLOAD ERROR', e);
            supportingFile.setStatusToCancelled();
            await this.fileService.update(supportingFile);
            throw new Error('Supporting upload failed to store file.');
        }

        supportingFile.setStatusToStored();
        await this.fileService.update(supportingFile);

        return supportingFile;
    }

    async deleteSupportingFile(fileId: FileId, submissionId: SubmissionId, user: User): Promise<FileId> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.DELETE, submission);
        if (!allowed) {
            throw new Error('User not allowed to delete files');
        }
        return await this.fileService.deleteSupportingFile(fileId, submissionId);
    }

    async saveFilesPage(user: User, submissionId: SubmissionId, coverLetter: string): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to update submission');
        }

        await this.submissionService.changeCoverLetter(submissionId, coverLetter);

        return this.getFullSubmission(submissionId);
    }

    async saveDetailsPage(user: User, submissionId: SubmissionId, details: ManuscriptDetails): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to update submission');
        }

        await this.submissionService.saveDetailsPage(submissionId, details);

        return this.getFullSubmission(submissionId);
    }

    /**
     * Return a full submission
     *
     * @todo add teams as well
     * @param submissionId
     */
    private async getFullSubmission(submissionId: SubmissionId): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission) {
            submission.files.manuscriptFile = await this.fileService.findManuscriptFile(submissionId);
            submission.files.supportingFiles = (await this.fileService.getSupportingFiles(submissionId)).filter(
                file => !file.isCancelled() && !file.isDeleted(),
            );
            const suggestion = await this.semanticExtractionService.getSuggestion(submissionId);
            if (suggestion) {
                submission.suggestions = [suggestion];
            }
            const teams = await this.teamService.findTeams(submissionId.toString());
            const details = teams.reduce(
                (acc, team) => {
                    switch (team.role) {
                        case 'suggestedSeniorEditor':
                        case 'opposedSeniorEditor':
                        case 'suggestedReviewingEditor':
                        case 'opposedReviewingEditor': {
                            acc.peopleDetails[team.role + 's'] = team.teamMembers.map(
                                tm => (tm as PeopleTeamMember).meta.elifePersonId,
                            );
                            return acc;
                        }

                        case 'opposedReviewer':
                        case 'suggestedReviewer': {
                            acc.peopleDetails[team.role + 's'] = team.teamMembers.map(
                                tm => (tm as PeopleReviewerTeamMember).meta,
                            );
                            return acc;
                        }

                        case 'author': {
                            acc.author = (team.teamMembers as Array<AuthorTeamMember>)[0].alias;
                            return acc;
                        }

                        default:
                            return acc;
                    }
                },
                { peopleDetails: {} } as TeamData,
            );

            console.log('details', details.peopleDetails);

            if (details.author) {
                submission.author = details.author;
            }

            if (details.peopleDetails) {
                submission.people = { ...details.peopleDetails, ...submission.people };
            }
        }
        return submission;
    }
}
