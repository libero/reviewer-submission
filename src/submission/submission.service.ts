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

  findAll(): Promise<Submission[]> {
    return this.submissionRepository.find();
  }
}
