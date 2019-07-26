import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionController } from '../../packages/submission/submission.controller';
import { Submission } from '../../packages/submission/submission.entity';

@Injectable()
export class SubmissionService {

  controller = null;

  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {
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
