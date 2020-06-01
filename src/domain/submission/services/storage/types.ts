import { SubmissionId } from '../../types';

export enum PackageLocationType {
    S3 = 'S3',
    SFTP = 'SFTP',
}

export interface PackageLocation {
    location: string;
    type: PackageLocationType;
    submissionId: SubmissionId;
}

export interface SubmissionWriter {
    write(id: SubmissionId, buffer: Buffer): Promise<PackageLocation>;
}
