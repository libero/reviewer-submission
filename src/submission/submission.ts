import { uuidType } from 'typesafe-uuid';
import { Author } from './people';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface Submission {
    id: SubmissionId;
    title: string;
    updated: Date;
    createdBy: string;
    status: string;
    articleType: string;
    // @TODO: check against xpub, does this live in meta or somewhere else (including deeper nesting within meta)?
    details?: Author;
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
    // @TODO: check against xpub, does this live in meta or somewhere else (including deeper nesting within meta)?
    details?: Author;
    meta: xpubMeta;
}

export interface DtoViewSubmission {
    id: SubmissionId;
    title: string;
    updated: Date;
    articleType: string;
    // @TODO: check against xpub, does this live in meta or somewhere else (including deeper nesting within meta)?
    details?: Author;
}

export interface SubmissionRepository {
    findAll(): Promise<Submission[]>;
    findById(id: SubmissionId): Promise<Submission | null>;
    update(sub: Submission): Promise<Submission | null>;
    delete(id: SubmissionId): Promise<boolean>;
    close(): void;
}
