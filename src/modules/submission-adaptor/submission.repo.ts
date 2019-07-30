// This should probably be called something else
import { SubmissionRepository, ISubmission } from '../../packages/submission/submission.repository';
import { Option, None } from 'funfix';

export class KnexSubmission implements SubmissionRepository {
  public async findAll(): Promise<ISubmission[]> {
    return [];
  }

  public async findById(id: string): Promise<Option<ISubmission>> {
    return None;
  }

  public async save(subm: ISubmission): Promise<ISubmission> {
    throw new Error('not implemented');
  }

}
