import { SubmissionId } from '../types';
import Submission from '../services/models/submission';

export interface SubmissionRepository {
    create(submission: Submission): Promise<Submission>;
    delete(id: SubmissionId): Promise<boolean>;
    findAll(): Promise<Submission[]>;
    findById(id: SubmissionId): Promise<Submission | null>;
    update(sub: Partial<Submission> & { id: SubmissionId }): Promise<Submission>;
}
