import { Option } from 'funfix';
import { uuidType } from 'typesafe-uuid';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface SubmissionRepository {
    findAll(): Promise<Submission[]>;
    findById(id: SubmissionId): Promise<Option<Submission>>;
    save(subm: Submission): Promise<Submission>;
    delete(id: SubmissionId): Promise<boolean>;
}

// I'm treating Submission as a DTO for Submission (./submission.entity)

export interface Submission {
    id: SubmissionId;
    title: string;
    updated: Date;
}
