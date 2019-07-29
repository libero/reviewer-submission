import { v4 as uuid } from 'uuid';
import { Submission } from './submission.entity';
// Needed for next stage
// import { SubmissionRepository} from './submission.repository';

export class SubmissionController {
  repository = null;

  constructor(repo : any) {
    this.repository = repo;
  }

  async findAll(): Promise<Submission[]> {
    return await this.repository.findAll();
  }

  async start(): Promise<Submission> {
    const submission: Submission = Submission.make(uuid());

    return this.repository.save(submission);
  }

  async findOne(id: string): Promise<Submission> {
    return await this.repository.findById(id);
  }

  async changeTitle(id: string, title: string): Promise<Submission> {
    const submission: Submission = await this.repository.findOne(id);

    submission.changeTitle(title);

    return this.repository.save(submission);
  }
}
