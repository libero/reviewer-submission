import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Submission } from '../domain/submission.entity';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async findAll(): Promise<Submission[]> {
    return await this.submissionRepository.find();
  }

  async create(): Promise<Submission> {
    const submission: Submission = Submission.make(uuid())

    return this.submissionRepository.save(submission);
  }

  async changeTitle(id: string, title: string): Promise<Submission> {
    const submission: Submission = await this.submissionRepository.findOne(id)

    submission.changeTitle(title)

    return this.submissionRepository.save(submission)
  }
}
