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
/*
PDH - This interface should be in the infrastructure folder as its purely private
to the repo.
*/
export interface DtoSubmission {
    id: SubmissionId;
    updated: Date;
    created_by: string;
    status: string;
    meta: xpubMeta;
}
/*
PDH - This should be in resolvers... mapper is then used to build model entities
and communicate with the model layer.
*/
export interface DtoViewSubmission {
    id: SubmissionId;
    title: string;
    updated: Date;
    articleType: string;
}

/*
Thought - part of the refactor - we should be using DTOs here not entities
*/
export interface SubmissionRepository {
    create(sub: Submission): Promise<Submission | null>;
    findAll(): Promise<Submission[]>;
    findById(id: SubmissionId): Promise<Submission | null>;
    update(sub: Submission): Promise<Submission | null>;
    delete(id: SubmissionId): Promise<boolean>;
    close(): void;
}
