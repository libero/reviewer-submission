import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionController } from '../../packages/submission/submission.controller';
import { KnexSubmissionRepository } from './submission.repo';
import { Submission } from '../../packages/submission/submission.entity';
import { ConfigService } from '../config/config.service';
import { Uuid } from '../../core';
import { Option, Some, None } from 'funfix';

import * as Knex from 'knex';

@Injectable()
export class SubmissionService {
  // Improvements (1) funfix (2) use dto not Submission class
  controller: Option<SubmissionController> = None;
  // submissionRepository = null;

  constructor(config: ConfigService) {
    // This function is only executed once, upon init. So I'll setup the submission repos here

    const knexConnection = Knex(config.getSubmissionRepositoryConnection());

    const submissionRepo = new KnexSubmissionRepository(knexConnection);
    submissionRepo.initSchema();

    this.controller = Some(new SubmissionController(submissionRepo));
  }

  async findAll(): Promise<Submission[]> {
    return await this.controller.map(controller => controller.findAll()).get();
  }

  async start(): Promise<Submission> {
    return this.controller.map(controller => controller.start()).get();
  }

  async findOne(id: Uuid): Promise<Submission> {
    return this.controller.map(controller => controller.findOne(id)).get();
  }

  async changeTitle(id: Uuid, title: string): Promise<Submission> {
    return this.controller
      .map(controller => controller.changeTitle(id, title))
      .get();
  }

  async deleteSubmission(id: Uuid): Promise<boolean> {
    return this.controller.map(controller => controller.deleteSubmission(id))
    .get();
  }
}
