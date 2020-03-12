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
import { FileType, FileId, FileStatus } from '../../domain/file/types';
import File from '../../domain/file/services/models/file';
import { v4 as uuid } from 'uuid';

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
        const allowed = this.permissionService.userCan(user, SubmissionOperation.UPDATE, submission);
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
        return submission;
    }

    async deleteManuscriptFile(fileId: FileId, submissionId: SubmissionId, user: User): Promise<boolean> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCan(user, SubmissionOperation.DELETE, submission);
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
    ): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCan(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }
        const { filename, mimetype: mimeType, createReadStream } = await file;
        const stream = createReadStream();

        submission.setManuscriptFile(FileId.fromUuid(uuid()), filename, mimeType, fileSize);

        const fileContents: Buffer = await new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chunks: Array<any> = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        const manuscriptFileDTO = submission.getManuscriptFile();

        if (!manuscriptFileDTO) {
            throw new Error('Manuscript file does not exist');
        }

        const uploadPromise = this.fileService.upload(fileContents, manuscriptFileDTO);

        submission.setManuscriptFileStatusToStored();

        const semanticExtractionPromise = this.semanticExtractionService.extractTitle(
            fileContents,
            mimeType,
            filename,
            submissionId,
        );

        try {
            await Promise.all([uploadPromise, semanticExtractionPromise]);
        } catch (e) {
            submission.setManuscriptFileStatusToCancelled();
        }

        // is this too generic in came
        // could be // submissionService.addManucript etc
        this.submissionService.update(submission);

        return submission;
    }

    async saveSupportingFile(
        user: User,
        submissionId: SubmissionId,
        file: FileUpload,
        fileSize: number,
    ): Promise<Submission> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCan(user, SubmissionOperation.UPDATE, submission);
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

        const fileContents: Buffer = await new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chunks: Array<any> = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        try {
            await this.fileService.upload(fileContents, supportingFile);
            supportingFile.setStatusToStored();
        } catch (e) {
            // @todo should this not be setStatusToDeleted ?
            supportingFile.setStatusToCancelled();
        }

        this.fileService.update(supportingFile);

        // Again because we are not following a DDD approach for the submission, i.e. we are not loading
        // the files when fetching a Submission, we need to load them separately and patch them in ¯\_(ツ)_/¯
        // this is bad because a developer needs to remember to do this every time a submission is manipulated
        // Submission is an anemic data model as all our logic pretty much now resides in services.
        const manuscriptFile = await this.fileService.findManuscriptFile(submissionId);
        const supportingFiles = (await this.fileService.getSupportingFiles(submissionId)).filter(
            file => !file.isCancelled() && !file.isDeleted(),
        );

        return new Submission({ ...submission, manuscriptFile, supportingFiles });
    }

    async deleteSupportingFile(fileId: FileId, submissionId: SubmissionId, user: User): Promise<boolean> {
        const submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCan(user, SubmissionOperation.DELETE, submission);
        if (!allowed) {
            throw new Error('User not allowed to delete files');
        }
        return await this.fileService.deleteSupportingFile(fileId, submissionId);
    }
}
