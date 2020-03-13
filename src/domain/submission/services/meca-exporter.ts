import { SubmissionId, SubmissionExporter } from '../../types';

export class MecaExporter implements SubmissionExporter {
    export(id: SubmissionId): Promise<Buffer> {
        return Promise.resolve(new Buffer(`this-is-a-test ${id}`));
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
