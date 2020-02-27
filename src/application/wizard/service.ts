import { FileUpload } from 'graphql-upload';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { FileService } from '../../domain/file/services/file-service';
import { AuthorTeamMember } from '../../domain/teams/repositories/types';
import { Author, SubmissionId } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { FileDTO } from 'src/domain/file/repositories/types';
import { FileType } from 'src/domain/file/types';

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

    async saveManuscriptFile(submissionId: SubmissionId, file: FileUpload, fileSize: number): Promise<File | null> {
        const { filename, mimetype: mimeType, createReadStream } = await file;
        const stream = createReadStream();

        const fileContents = await new Promise((resolve, reject) => {
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

        this.fileService.create(submissionId, filename, mimeType, fileSize, FileType.MANUSCRIPT_SOURCE_PENDING);
        // {
        //     id: FileId;
        //     submissionId: SubmissionId;
        //     status: string;
        //     filename: string;
        //     url: string;
        //     mimeType: string;
        //     size: number;
        //     created: Date;
        //     updated: Date;
        //     type: string;
        // })

    }
}
