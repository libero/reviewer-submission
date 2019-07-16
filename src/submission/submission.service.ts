import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './submission.entity';

@Injectable()
export class SubmissionService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
  ) {}

  async findAll(): Promise<Submission[]> {
    return await this.submissionRepository.find();
  }

  async insertOne(): Promise<string> {

    const thing: Submission = {
      id: 100,
      title: 'test submission',
    };

    return this.submissionRepository.save(thing).then(() => 'some string');
  }
}
