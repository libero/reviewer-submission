import { SubmissionId } from '../../types';
import { SubmissionExporter } from './types';
// import { FileService } from '../../../file/services/file-service';

export class MecaExporter implements SubmissionExporter {
    // constructor(private readonly fileService: FileService) {}

    async export(submissionId: SubmissionId): Promise<Buffer> {
        return Promise.resolve(new Buffer(`this-is-a-test ${submissionId}`));
        // const manuscriptFile = await this.fileService.findManuscriptFile(submissionId);
        // const supportingFiles = await this.fileService.getSupportingFiles(submissionId);

        // if (!manuscriptFile) {
        //     throw new Error('No manuscript file');
        // }

        // const uploadedFiles = await Promise.all(
        //     [manuscriptFile, ...supportingFiles].map(async (file, index) => ({
        //         id: file.id,
        //         filename: file.filename,
        //         content: await this.fileService.getFileContent(file),
        //         type: file.type,
        //         mimeType: file.mimeType,
        //         index,
        //     })),
        // );

        // const mandatoryFiles = [{ filename: 'article.xml', content: articleGenerator }];
    }
}
