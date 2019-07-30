import { Submission } from './submission.entity';
import { Option } from 'funfix';

export interface SubmissionRepository {
  findAll(): Promise<Submission[]>;
  findById(id: string): Promise<Option<Submission>>;
  save(subm: Submission): Promise<Submission>;
}

export interface ISubmission {
  id: string;
  title: string;
  updated: Date;
}
