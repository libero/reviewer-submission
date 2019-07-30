import { Submission } from './submission.entity';
import { Option } from 'funfix';

export interface SubmissionRepository {
  findAll(): Promise<ISubmission[]>;
  findById(id: string): Promise<Option<ISubmission>>;
  save(subm: ISubmission): Promise<ISubmission>;
}

// I'm treating ISubmission as a DTO for submission

export interface ISubmission {
  id: string;
  title: string;
  updated: Date;
}
