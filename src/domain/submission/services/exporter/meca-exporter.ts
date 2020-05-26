import JSZip from 'jszip';
import { SubmissionExporter } from './types';
import Submission from '../models/submission';
import { FileService } from '../../../file/services/file-service';
import { FileId } from '../../../file/types';
import {
    generateArticle,
    generateCoverLetter,
    generateDisclosure,
    generateManifest,
    generateTransfer,
    removeUnicode,
} from './file-generators';

interface ArchiveFile {
    id?: FileId;
    filename: string;
    content: string;
    type?: string;
    mimeType?: string;
}

export class MecaExporter implements SubmissionExporter {
    constructor(private readonly fileService: FileService) {}

    async export(submission: Submission, ip: string): Promise<Buffer> {
        const manuscriptFile = await this.fileService.findManuscriptFile(submission.id);
        const supportingFiles = await this.fileService.getSupportingFiles(submission.id);

        if (!manuscriptFile) {
            throw new Error('No manuscript file');
        }

        const uploadedFiles = await Promise.all(
            [manuscriptFile, ...supportingFiles].map(
                async (file): Promise<ArchiveFile> => ({
                    id: file.id,
                    filename: file.filename,
                    content: await this.fileService.getFileContent(file),
                    type: file.type,
                    mimeType: file.mimeType,
                }),
            ),
        );

        const mandatoryFiles = [
            { filename: 'article.xml', content: generateArticle(submission) },
            { filename: 'cover_letter.pdf', content: generateCoverLetter(submission.files.coverLetter || '') },
            { filename: 'disclosure.pdf', content: generateDisclosure(submission, ip) },
            { filename: 'manifest.xml', content: generateManifest(submission) },
            { filename: 'transfer.xml', content: generateTransfer('') },
        ];

        const allFiles = mandatoryFiles.concat(uploadedFiles);
        const zip = new JSZip();

        await Promise.all(
            allFiles.map(async (file, index) => {
                zip.file(removeUnicode(file.filename, index), await file.content);
            }),
        );

        return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    }
}
