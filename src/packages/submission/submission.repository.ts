import { Submission } from './submission.entity';

export interface SubmissionRepository {

  findAll(): Promise<Submission[]>;
  findById(id: string): Promise<Submission>;
  save(): Promise<Submission>;
}
