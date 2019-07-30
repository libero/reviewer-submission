import { v4 as uuid } from 'uuid';
import { Submission } from './submission.entity';
import { ISubmission, SubmissionRepository } from './submission.repository';
import { Option, None, Some } from 'funfix';

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

  async findOne(id: string): Promise<Submission> {
    return await this.repository
      .map(async repo => new Submission((await repo.findById(id)).get()))
      .get();
  }

  async changeTitle(id: string, title: string): Promise<Submission> {
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
}
