import { Option } from 'funfix';
import { uuidType } from '../../core';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface SubmissionRepository {
  findAll(): Promise<ISubmission[]>;
  findById(id: SubmissionId): Promise<Option<ISubmission>>;
  save(subm: ISubmission): Promise<ISubmission>;
}

// I'm treating ISubmission as a DTO for submission

export interface ISubmission {
  id: SubmissionId;
  title: string;
  updated: Date;
}
