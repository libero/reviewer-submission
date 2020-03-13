import { SubmissionWriter, PackageLocation, SubmissionId } from '../types';

export class SftpStore implements SubmissionWriter {
    private remotePath = 'somewhere-in-AWS';
    private mecaPostfix = '-meca.zip';

    write(id: SubmissionId, buffer: Buffer): Promise<PackageLocation> {
        // @todo: Implement
        return Promise.resolve({
            location: `${this.remotePath}/${id}${this.mecaPostfix}`,
            type: 'SFTP',
            submissionId: id,
        });
    }
}
