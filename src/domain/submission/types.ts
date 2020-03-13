import { uuidType } from 'typesafe-uuid';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface Person {
    firstName: string;
    lastName: string;
    email: string;
    institution: string;
}

export type Author = {
    firstName: string;
    lastName: string;
    email: string;
    aff: string;
};

export interface PackageLocation {
    location: string;
    type: string; // @todo: Make this an enumeration.
    submissionId: SubmissionId;
}

export interface SubmissionWriter {
    write(id: SubmissionId, buffer: Buffer): Promise<PackageLocation>;
}

export interface SubmissionExporter {
    export(id: SubmissionId): Promise<Buffer>;
}
