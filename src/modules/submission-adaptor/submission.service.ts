import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionController } from '../../packages/submission/submission.controller';
import { Submission } from '../../packages/submission/submission.entity';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SubmissionService {

  // Improvements (1) funfix (2) use dto not Submission class
  controller = null;
  // submissionRepository = null;

  constructor(config: ConfigService,
              @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {
    // TODO: submissionReposi
    // const connection = new knex(config.getSubmissionRepositoryConnection())
    // this.submissionRepository = new KnexSubmissionRepository(connection);

    // Obviously, this isn't the way we should do things moving forward, but let's make it work before
    // We refactor it properly.
    this.controller = new SubmissionController({
      save: async (s: any) => await submissionRepository.save(s),
      findById: submissionRepository.findOne,
      findAll: async () => await submissionRepository.find(),
    });
  }

  async findAll(): Promise<Submission[]> {
    return await this.controller.findAll();
  }

  async start(): Promise<Submission> {
    return this.controller.start();
  }

  async findOne(id: string): Promise<Submission> {
    return this.controller.findOne(id);
  }

  async changeTitle(id: string, title: string): Promise<Submission> {
    return this.controller.changeTitle(id, title);
  }
}
