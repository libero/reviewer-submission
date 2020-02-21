import { SubmissionId, TeamId } from '../types';

export interface SubmissionRepository {
    create(sub: Omit<SubmissionDTO, 'updated'>): Promise<SubmissionDTO>;
    delete(id: SubmissionId): Promise<boolean>;
    findAll(): Promise<SubmissionDTO[]>;
    findById(id: SubmissionId): Promise<SubmissionDTO | null>;
    update(sub: Partial<SubmissionDTO> & { id: SubmissionId }): Promise<SubmissionDTO>;
}

export interface TeamRepository {
    findByObjectId(id: string): Promise<TeamDTO[]>;
    create(dtoSubmission: Omit<TeamDTO, 'updated'>): Promise<TeamDTO>;
    update(dtoTeam: Partial<TeamDTO> & { id: TeamId }): Promise<TeamDTO>;
}

export interface TeamDTO {
    id: TeamId;
    updated: Date;
}

export interface SubmissionDTO {
    id: SubmissionId;
    updated: Date;
    createdBy: string;
    status: string;
    articleType: string;
    title: string;
}
