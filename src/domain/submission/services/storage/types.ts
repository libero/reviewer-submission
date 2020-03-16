import { SubmissionId } from '../../types';

export interface PackageLocation {
    location: string;
    type: string; // @todo: Make this an enumeration.
    submissionId: SubmissionId;
}

export interface SubmissionWriter {
    write(id: SubmissionId, buffer: Buffer): Promise<PackageLocation>;
}
