import { FileUpload } from 'graphql-upload';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { FileService } from '../../domain/file/services/file-service';
import { SemanticExtractionService } from '../../domain/semantic-extraction/services/semantic-extraction-service';
import {
    AuthorDetails,
    SubmissionId,
    ManuscriptDetails,
    EditorDetails,
    DisclosureDetails,
    SubmissionStatus,
} from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { AuthorTeamMember, EditorTeamMember, EditorReviewerTeamMember } from '../../domain/teams/repositories/types';
import { PermissionService, SubmissionOperation } from '../permission/service';
import { User } from 'src/domain/user/user';
import { FileType, FileId } from '../../domain/file/types';
import { PubSub } from 'apollo-server-express';
import { Config } from '../../config';
import { InfraLogger as logger } from '../../logger';
import File from '../../domain/file/services/models/file';

interface TeamData {
    editorDetails: EditorDetails & {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    author?: AuthorDetails;
}

const rolesToProps: { [key: string]: string } = {
    suggestedSeniorEditor: 'suggestedSeniorEditors',
    opposedSeniorEditor: 'opposedSeniorEditors',
    suggestedReviewingEditor: 'suggestedReviewingEditors',
    opposedReviewingEditor: 'opposedReviewingEditors',
    opposedReviewer: 'opposedReviewers',
    suggestedReviewer: 'suggestedReviewers',
};

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
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.READ, submission);
        if (!allowed) {
            throw new Error('User not allowed to read submission');
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

        await this.teamService.updateOrCreateAuthor(submissionId.toString(), details);

        await this.submissionService.saveAuthorDetails(submission);

        return this.getFullSubmission(submissionId);
    }

    async saveEditorPage(user: User, submissionId: SubmissionId, details: EditorDetails): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }
        await this.teamService.addOrUpdateEditorTeams(submissionId.toString(), details);

        await this.submissionService.saveEditorDetails(
            submission,
            details.opposedReviewersReason,
            details.opposedReviewingEditorsReason,
            details.opposedSeniorEditorsReason,
        );

        return this.getFullSubmission(submissionId);
    }

    async saveDisclosurePage(user: User, submissionId: SubmissionId, details: DisclosureDetails): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to submit');
        }

        await this.submissionService.saveDisclosureDetails(submission, details);

        return this.getFullSubmission(submissionId);
    }

    async submit(user: User, submissionId: SubmissionId, ip: string): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to submit');
        }
        const fullSubmission = await this.getFullSubmission(submissionId);
        fullSubmission.status = submission.status;
        await this.submissionService.submit(fullSubmission, ip, user.id);

        return this.getFullSubmission(submissionId);
    }

    async deleteManuscriptFile(fileId: FileId, submissionId: SubmissionId, user: User): Promise<boolean> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.DELETE, submission);
        if (!allowed) {
            throw new Error('User not allowed to delete files');
        }
        return await this.fileService.deleteManuscript(user, fileId, submissionId);
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
            user,
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
            await this.semanticExtractionService.extractSuggestions(fileContents, mimeType, filename, submissionId);
        } catch (e) {
            logger.error(submissionId, 'MANUSCRIPT UPLOAD ERROR', e);
            throw new Error('Manuscript upload failed to store file.');
        }

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
            user,
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
            throw new Error('Supporting upload failed to store file.');
        }

        return supportingFile;
    }

    async deleteSupportingFile(fileId: FileId, submissionId: SubmissionId, user: User): Promise<FileId> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.DELETE, submission);
        if (!allowed) {
            throw new Error('User not allowed to delete files');
        }
        return await this.fileService.deleteSupportingFile(user, fileId, submissionId);
    }

    async saveFilesPage(user: User, submissionId: SubmissionId, coverLetter: string): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to update submission');
        }

        await this.submissionService.saveFilesDetails(submission, coverLetter);

        return this.getFullSubmission(submissionId);
    }

    async saveDetailsPage(user: User, submissionId: SubmissionId, details: ManuscriptDetails): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to update submission');
        }

        await this.submissionService.saveManuscriptDetails(submission, details);

        return this.getFullSubmission(submissionId);
    }

    /**
     * Return a full submission
     *
     * @todo add teams as well
     * @param submissionId
     */
    public async getFullSubmission(submissionId: SubmissionId): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        if (submission) {
            submission.files.manuscriptFile = await this.fileService.findManuscriptFile(submission.id);
            submission.files.supportingFiles = (await this.fileService.getSupportingFiles(submission.id)).filter(
                file => !file.isCancelled() && !file.isDeleted(),
            );
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
                            acc.editorDetails[rolesToProps[team.role]] = team.teamMembers.map(
                                tm => (tm as EditorTeamMember).meta.elifePersonId,
                            );
                            return acc;
                        }

                        case 'opposedReviewer':
                        case 'suggestedReviewer': {
                            acc.editorDetails[rolesToProps[team.role]] = team.teamMembers.map(tm => {
                                const meta = (tm as EditorReviewerTeamMember).meta;
                                return { ...meta, email: (meta.email || '').trim() };
                            });
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
                { editorDetails: {} } as TeamData,
            );

            if (details.author) {
                submission.author = { ...details.author, email: (details.author.email || '').trim() };
            }

            if (details.editorDetails) {
                submission.editorDetails = { ...details.editorDetails, ...submission.editorDetails };
            }

            if (submission.status) {
                switch (submission.status) {
                    case SubmissionStatus.INITIAL:
                        submission.status = 'CONTINUE_SUBMISSION';
                        break;
                    case SubmissionStatus.MECA_EXPORT_PENDING:
                    case SubmissionStatus.MECA_EXPORT_FAILED:
                    case SubmissionStatus.MECA_EXPORT_SUCCEEDED:
                    case SubmissionStatus.MECA_IMPORT_FAILED:
                    case SubmissionStatus.MECA_IMPORT_SUCCEEDED:
                        submission.status = 'SUBMITTED';
                        break;
                    default:
                        submission.status = 'CONTINUE_SUBMISSION';
                        break;
                }
            }
        }
        return submission;
    }
}
