import { v4 as uuid } from 'uuid';
import { Submission } from './submission.entity';
import { ISubmission, SubmissionRepository, SubmissionId } from './submission.repository';
import { Option, None } from 'funfix';

export class SubmissionController {
  repository: Option<SubmissionRepository> = None;

  constructor(repo: SubmissionRepository) {
    this.repository = Option.of(repo);
  }

  async findAll(): Promise<Submission[]> {
    return await this.repository
      .map(async repo =>
        (await repo.findAll()).map((isub: ISubmission) => new Submission(isub)),
      )
      .get();
  }

  async start(): Promise<Submission> {
    const id = SubmissionId.fromUuid(uuid());
    const submission: Submission = await Submission.make(id);

    await this.repository
      .map(async repo => await repo.save(submission.toDTO()))
      .get();

    return submission;
  }

  async findOne(id: SubmissionId): Promise<Submission> {
    return await this.repository
      .map(async repo => new Submission((await repo.findById(id)).get()))
      .get();
  }

  async changeTitle(id: SubmissionId, title: string): Promise<Submission> {
    return await this.repository
      .map(async repo => {
        const submission: Submission = new Submission(
          (await repo.findById(id)).get(), // XXX: Will error if submission can't be found
        );

        submission.changeTitle(title);

        return new Submission(await repo.save(submission.toDTO()));
      })
      .get();
  }

  async deleteSubmission(id: SubmissionId): Promise<boolean> {
    return await this.repository.map(async repo => {
      return await repo.delete(id);
    }).get();
  }
}
