import { SubmissionId } from '../../types';
import { SubmissionExporter } from './types';
import { FileService } from '../../../file/services/file-service';
import articleGenerator from 

export class MecaExporter implements SubmissionExporter {
    constructor(private readonly fileService: FileService) {}

    async export(submissionId: SubmissionId): Promise<Buffer> {
        const manuscriptFile = await this.fileService.findManuscriptFile(submissionId);
        const supportingFiles = await this.fileService.getSupportingFiles(submissionId);

        if (!manuscriptFile) {
            throw new Error('No manuscript file');
        }

        const uploadedFiles = await Promise.all(
            [manuscriptFile, ...supportingFiles].map(async (file, index) => ({
                id: file.id,
                filename: file.filename,
                content: await this.fileService.getFileContent(file),
                type: file.type,
                mimeType: file.mimeType,
                index,
            })),
        );

        const mandatoryFiles = [{ filename: 'article.xml', content: articleGenerator }];

        /*
        @todo: Implement something like...

        const uploadedFiles = manuscript.files.map((file, index) => ({
          id: file.id,
          filename: file.filename,
          content: getContent(file),
          type: file.type,
          mimeType: file.mimeType,
          index,
        }))

        const manditoryFiles = [
          { filename: 'article.xml', content: articleGenerator(manuscript) },
          {
            filename: 'cover_letter.pdf',
            content: coverLetterGenerator(manuscript),
          },
          {
            filename: 'disclosure.pdf',
            content: disclosureGenerator(manuscript, clientIp),
          },
          { filename: 'manifest.xml', content: manifestGenerator(uploadedFiles) },
          { filename: 'transfer.xml', content: transferGenerator('') },
        ]

        const allFiles = manditoryFiles.concat(uploadedFiles)
        return archiveGenerator(allFiles)
        */
    }
}
