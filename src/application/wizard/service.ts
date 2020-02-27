import { FileUpload } from 'graphql-upload';
import axios from 'axios';
import xml2js from 'xml2js';
import { promisify } from 'util';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { FileService } from '../../domain/file/services/file-service';
import { AuthorTeamMember } from '../../domain/teams/repositories/types';
import { Author, SubmissionId } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { FileType } from '../../domain/file/types';
import File from '../../domain/file/services/models/file';

export class WizardService {
    constructor(
        private readonly submissionService: SubmissionService,
        private readonly teamService: TeamService,
        private readonly fileService: FileService,
    ) {}

    async saveDetailsPage(id: SubmissionId, details: Author): Promise<Submission | null> {
        // needs permissions checks
        const submission = await this.submissionService.get(id);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const team = await this.teamService.find(id.value, 'author');
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
                objectId: id.value,
                objectType: 'manuscript',
            });
        }
        return submission;
    }

    async saveManuscriptFile(submissionId: SubmissionId, file: FileUpload, fileSize: number): Promise<File> {
        const { filename, mimetype: mimeType, createReadStream } = await file;
        const stream = createReadStream();

        const fileContents: Buffer = await new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chunks: Array<any> = [];
            stream.on('data', chunk => {
                chunks.push(chunk);
            });
            stream.on('error', reject);
            stream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });

        const savedFile = await this.fileService.create(
            submissionId,
            filename,
            mimeType,
            fileSize,
            FileType.MANUSCRIPT_SOURCE_PENDING,
        );

        // TODO: resolve alongside scienceBeam
        const uploadPromise = this.fileService.upload(fileContents, savedFile);

        const semanticExtractionPromise = this.semanticExtractionService.extractTitle(fileContents, mimeType, filename);

        const results = await Promise.all([uploadPromise, semanticExtractionPromise]);

        return savedFile;
    }
}
