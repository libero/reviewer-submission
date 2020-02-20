import { SubmissionId } from '../types';

export interface SubmissionRepository {
    create(sub: Omit<SubmissionDTO, 'updated'>): Promise<SubmissionDTO>;
    delete(id: SubmissionId): Promise<boolean>;
    findAll(): Promise<SubmissionDTO[]>;
    findById(id: SubmissionId): Promise<SubmissionDTO | null>;
    update(sub: Partial<SubmissionDTO> & { id: SubmissionId }): Promise<SubmissionDTO>;
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
