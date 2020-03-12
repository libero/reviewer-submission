import { SubmissionId } from '../types';

export interface SubmissionRepository {
    create(sub: Omit<SubmissionDTO, 'updated'>): Promise<SubmissionDTO>;
    delete(id: SubmissionId): Promise<boolean>;
    findAll(): Promise<SubmissionDTO[]>;
    findById(id: SubmissionId): Promise<SubmissionDTO | null>;
    update(sub: Partial<SubmissionDTO> & { id: SubmissionId }): Promise<SubmissionDTO>;
}

// The DTO can contain any data (across all tables in the database) pertaining to the Submission Domain concept.
// Beware: that an instance may not contain all the data.
export interface SubmissionDTO {
    id: SubmissionId;
    updated: Date;
    createdBy: string;
    status: string;
    articleType: string;
    title: string;
    subjects: string[];
    previouslyDiscussed: string;
    previouslySubmitted: string[];
    cosubmission: string[];
    // put in manuscriptfileDTO ???
}
