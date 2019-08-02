import { v4 as uuid } from 'uuid';
import { Submission } from './submission.entity';
import { ISubmission, SubmissionRepository } from './submission.repository';
import { Option, None, Some } from 'funfix';
import { Uuid } from '../../core';

export class SubmissionController {
  repository: Option<SubmissionRepository> = None;

  constructor(repo: SubmissionRepository) {
    this.repository = Some(repo);
  }

  async findAll(): Promise<Submission[]> {
    return await this.repository
      .map(async repo =>
        (await repo.findAll()).map((isub: ISubmission) => new Submission(isub)),
      )
      .get();
  }

  async start(): Promise<Submission> {
    const submission: Submission = Submission.make(uuid());

    return await this.repository
      .map(async repo => new Submission(await repo.save(submission)))
      .get();
  }

  async findOne(id: Uuid): Promise<Submission> {
    return await this.repository
      .map(async repo => new Submission((await repo.findById(id)).get()))
      .get();
  }

  async changeTitle(id: Uuid, title: string): Promise<Submission> {
    return await this.repository
      .map(async repo => {
        const submission: Submission = new Submission(
          (await repo.findById(id)).get(), // XXX: Will error if submission can't be found
        );

        submission.changeTitle(title);

        return new Submission(await repo.save(submission));
      })
      .get();
  }

  async deleteSubmission(id: Uuid): Promise<boolean> {
    return await this.repository.map(async repo => {
      return await repo.delete(id);
    }).get();
  }
}
