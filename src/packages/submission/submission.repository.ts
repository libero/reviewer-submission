import { Option } from 'funfix';
import { uuidType } from 'typesafe-uuid';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface SubmissionRepository {
    findAll(): Promise<ISubmission[]>;
    findById(id: SubmissionId): Promise<Option<ISubmission>>;
    save(subm: ISubmission): Promise<ISubmission>;
    delete(id: SubmissionId): Promise<boolean>;
    close(): void;
}

// I'm treating ISubmission as a DTO for Submission
export interface ISubmission {
    id: SubmissionId;
    title: string;
    updated: Date;
}
