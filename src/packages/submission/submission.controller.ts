import { v4 as uuid } from 'uuid';
import { Submission } from './submission.entity';
import { SubmissionRepository } from './submission.repository';
import { Option, None, Some } from 'funfix';

export class SubmissionController {
  repository: Option<SubmissionRepository> = None;

  constructor(repo: SubmissionRepository) {
    this.repository = Some(repo);
  }

  async findAll(): Promise<Submission[]> {
    return await this.repository
      .map(repo => repo.findAll())
      .getOrElseL(() => {
        // tslint:disable-next-line
        console.error('No repo');

        return [];
      });
  }

  async start(): Promise<Submission> {
    const submission: Submission = Submission.make(uuid());

    return this.repository.map(repo => repo.save(submission)).get();
  }

  async findOne(id: string): Promise<Submission> {
    return await this.repository.map(repo => repo.findById(id)).get();
  }

  async changeTitle(id: string, title: string): Promise<Submission> {
    return await this.repository
      .map(async repo => {
        const submission: Submission = await repo.findById(id);

        submission.changeTitle(title);

        return await repo.save(submission);
      })
      .get();
  }
}
