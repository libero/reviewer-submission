import { FileUpload } from 'graphql-upload';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { FileService } from '../../domain/file/services/file-service';
import { SemanticExtractionService } from '../../domain/semantic-extraction/services/semantic-extraction-service';
import { Author, SubmissionId } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { AuthorTeamMember } from '../../domain/teams/repositories/types';
import { PermissionService, SubmissionOperation } from '../permission/service';
import { User } from 'src/domain/user/user';
import { FileType, FileId } from '../../domain/file/types';
import { PubSub } from 'apollo-server-express';
import { ReadStream } from 'fs';
// import { CompletedPart } from 'aws-sdk/clients/s3';

export class WizardService {
    constructor(
        private readonly permissionService: PermissionService,
        private readonly submissionService: SubmissionService,
        private readonly teamService: TeamService,
        private readonly fileService: FileService,
        private readonly semanticExtractionService: SemanticExtractionService,
    ) {}

    async saveAuthorPage(user: User, submissionId: SubmissionId, details: Author): Promise<Submission | null> {
        const submission = await this.submissionService.get(submissionId);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }

        const team = await this.teamService.find(submissionId.value, 'author');
        const teamMembers: Array<AuthorTeamMember> = [
            {
                alias: details,
                meta: { corresponding: true },
            },
        ];
        if (team) {
            this.teamService.update({
                ...team,
                teamMembers,
            });
        } else {
            this.teamService.create({
                role: 'author',
                teamMembers,
                objectId: submissionId.value,
                objectType: 'manuscript',
            });
        }

        return this.getFullSubmission(submissionId);
    }

    async submit(user: User, submissionId: SubmissionId): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to submit');
        }

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

    private async extractContentFromStream(stream: ReadStream): Promise<Buffer> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chunks: Array<any> = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
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
            const [_, fileContents] = await Promise.all([
                await this.fileService.uploadManuscript(stream, manuscriptFile, user.id, pubsub),
                await this.extractContentFromStream(stream),
            ]);
            await this.semanticExtractionService.extractTitle(fileContents, mimeType, filename, submissionId);
            manuscriptFile.setStatusToStored();
        } catch (e) {
            console.log(e, 'cancelled');
            manuscriptFile.setStatusToCancelled();
        }
        await this.fileService.update(manuscriptFile);
        return this.getFullSubmission(submissionId);
    }

    async saveSupportingFile(
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
            await this.fileService.uploadSupportingFile(stream, supportingFile, user.id, pubsub);
            supportingFile.setStatusToStored();
        } catch (e) {
            // @todo should this not be setStatusToDeleted ?
            supportingFile.setStatusToCancelled();
        }

        this.fileService.update(supportingFile);

        return this.getFullSubmission(submissionId);
    }

    async deleteSupportingFile(fileId: FileId, submissionId: SubmissionId, user: User): Promise<boolean> {
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

    /**
     * Return a full submission
     *
     * @todo add teams as well
     * @param submissionId
     */
    private async getFullSubmission(submissionId: SubmissionId): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const manuscriptFile = await this.fileService.findManuscriptFile(submissionId);
        const supportingFiles = (await this.fileService.getSupportingFiles(submissionId)).filter(
            file => !file.isCancelled() && !file.isDeleted(),
        );
        const suggestion = await this.semanticExtractionService.getSuggestion(submissionId);

        return { ...submission, manuscriptFile, supportingFiles, suggestions: [suggestion] } as Submission;
    }
}
