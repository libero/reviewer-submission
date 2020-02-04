import { Option } from 'funfix';
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
    findAll(): Promise<Option<Submission[]>>;
    findById(id: SubmissionId): Promise<Option<Submission>>;
    changeTitle(id: SubmissionId, title: string): Promise<Option<Submission>>;

    create(articleType: string): Promise<Option<Submission>>;
    save(sub: Submission): Promise<Option<Submission>>;
    delete(id: SubmissionId): Promise<number>;
    close(): void;
}
