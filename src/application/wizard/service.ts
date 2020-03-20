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
import { CompletedPart } from 'aws-sdk/clients/s3';

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
            const uploadPromise = await this.fileService.uploadManuscript(manuscriptFile);
            let partNumber = 1;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chunks: Array<any> = [];
            const parts: { ETag: string | undefined; PartNumber: number }[] = [];

            for await (const chunk of stream) {
                const bytesRead = stream.bytesRead;
                const { ETag } = await this.fileService.handleMultipartChunk(
                    user.id,
                    manuscriptFile,
                    chunk,
                    partNumber,
                    uploadPromise,
                    pubsub,
                    bytesRead,
                );
                parts.push({ ETag, PartNumber: partNumber });
                chunks.push(chunk);
                partNumber++;
            }
            const fileContents = Buffer.concat(chunks);

            console.log(uploadPromise.UploadId);
            await this.fileService.completeMultipartUpload(manuscriptFile.url, uploadPromise.UploadId, parts);
            await this.semanticExtractionService.extractTitle(fileContents, mimeType, filename, submissionId);

            manuscriptFile.setStatusToStored();
            // await Promise.all([uploadPromise, semanticExtractionPromise]);
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

        await new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chunks: Array<any> = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        try {
            await this.fileService.uploadSupportingFile(supportingFile);
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
