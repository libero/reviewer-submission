import { SubmissionId } from '../types';

export interface SubmissionRepository {
    findAll(): Promise<SubmissionDTO[]>;
    findById(id: SubmissionId): Promise<SubmissionDTO | null>;
    save(sub: SubmissionDTO): Promise<SubmissionDTO | null>;
    delete(id: SubmissionId): Promise<boolean>;
    close(): void;
}

export interface SubmissionDTO {
    id: SubmissionId;
    updated: Date;
    createdBy: string;
    status: string;
    articleType: string;
    title: string;
}
