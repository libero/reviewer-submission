import { v4 as uuid } from 'uuid';
import { Entity, CreateDateColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Submission } from './submission.entity';

export class SubmissionController {
  repository = null

  constructor(repo) {
    this.repository = repo
  }

  async findAll(): Promise<Submission[]> {
    return await this.repository.find();
  }

  async start(): Promise<Submission> {
    const submission: Submission = Submission.make(uuid());

    return this.repository.save(submission);
  }

  async findOne(id: string): Promise<Submission> {
    const submission: Submission = await this.repository.findOne(id);

    return submission;
  }

  async changeTitle(id: string, title: string): Promise<Submission> {
    const submission: Submission = await this.repository.findOne(id);

    submission.changeTitle(title);

    return this.repository.save(submission);
  }
}
