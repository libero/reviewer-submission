import { Option } from 'funfix';
import { Uuid } from '../../core';

export interface SubmissionRepository {
  findAll(): Promise<ISubmission[]>;
  findById(id: Uuid): Promise<Option<ISubmission>>;
  save(subm: ISubmission): Promise<ISubmission>;
  delete(id: Uuid): Promise<boolean>;
}

// I'm treating ISubmission as a DTO for submission

export interface ISubmission {
  id: Uuid;
  title: string;
  updated: Date;
}
