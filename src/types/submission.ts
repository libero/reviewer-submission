import { uuidType } from 'typesafe-uuid';

// TODO: This shouldn't be here. Come back post refactor
export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface Submission {
    id: SubmissionId;
    title: string;
    updated: Date;
    articleType: string;
}

export interface DtoSubmission {
    id: SubmissionId;
    title: string;
    updated: Date;
    articleType: string;
}

export interface DtoViewSubmission {
    id: SubmissionId;
    title: string;
    updated: Date;
    articleType: string;
}

export interface SubmissionRepository {
    findAll(): Promise<Submission[]>;
    findById(id: SubmissionId): Promise<Submission | null>;
    save(sub: Submission): Promise<Submission | null>;
    delete(id: SubmissionId): Promise<boolean>;
    close(): void;
}
