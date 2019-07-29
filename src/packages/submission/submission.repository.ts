import { Submission } from './submission.entity';

export interface SubmissionRepository {
  findAll(): Promise<Submission[]>;
  findById(id: string): Promise<Submission>;
  save(subm: Submission): Promise<Submission>;
}

export interface ISubmission {
  id: string;
  title: string;
  updated: Date;
}
