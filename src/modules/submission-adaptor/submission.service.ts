import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionController } from '../../packages/submission/submission.controller';
import { Submission } from '../../packages/submission/submission.entity';
import { ConfigService } from '../config/config.service';
import { Option, Some, None } from 'funfix';

@Injectable()
export class SubmissionService {

  // Improvements (1) funfix (2) use dto not Submission class
  controller: Option<SubmissionController> = None;
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
    
    this.controller = Some(new SubmissionController(
      // This object is actually the submission repository, it just follows the definition provided
      // This is all going to be removed when we add knex
    {
      save: async (s: any) => await submissionRepository.save(s),
      findById: async (id: string) => Option.of(await submissionRepository.findOne(id)),
      findAll: async () => await submissionRepository.find(),
    }));
  }

  async findAll(): Promise<Submission[]> {
    return await this.controller.map(controller => controller.findAll()).get();
  }

  async start(): Promise<Submission> {
    return this.controller.map(controller => controller.start()).get(); 
  }

  async findOne(id: string): Promise<Submission> {
    return this.controller.map(controller => controller.findOne(id)).get();
  }

  async changeTitle(id: string, title: string): Promise<Submission> {
    return this.controller.map(controller => controller.changeTitle(id, title)).get();
  }
}
