import { SubmissionId } from '../../types';
import { PackageLocation, SubmissionWriter } from './types';

export class SftpStore implements SubmissionWriter {
    private remotePath = 'somewhere-in-AWS';
    private mecaPostfix = '-meca.zip';

    // todo: remove this for next PR
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    write(id: SubmissionId, buffer: Buffer): Promise<PackageLocation> {
        // @todo: Implement
        return Promise.resolve({
            location: `${this.remotePath}/${id}${this.mecaPostfix}`,
            type: 'SFTP',
            submissionId: id,
        });
    }
}
