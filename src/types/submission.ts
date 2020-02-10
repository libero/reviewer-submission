import { uuidType } from 'typesafe-uuid';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface Submission {
    id: SubmissionId;
    title: string;
    updated: Date;
    createdBy: string;
    status: string;
    articleType: string;
}

export type xpubMeta = {
    articleType: string;
    title: string;
};
export interface DtoSubmission {
    id: SubmissionId;
    updated: Date;
    created_by: string;
    status: string;
    meta: xpubMeta;
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
