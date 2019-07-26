import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionController } from '../../packages/submission/submission.controller';
import { Submission } from '../../packages/submission/submission.entity';
import { knex } from 'knex';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SubmissionService {

  // Improvements (1) funfix (2) use dto not Submission class
  controller = null;
  submissionRepository = null;

  constructor(config: ConfigService) {
    const connection = new knex(config.getSubmissionRepositoryConnection())
    this.submissionRepository = new KnexSubmissionRepository(connection);
    this.controller = new SubmissionController(this.submissionRepository);
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
