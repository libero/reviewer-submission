import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionResolver } from './submission.resolver';
import { Submission } from '../../packages/submission/submission.entity';
import { SubmissionService } from './submission.service';

@Module({
  imports: [TypeOrmModule.forFeature([Submission])],
  providers: [SubmissionService, SubmissionResolver],
})

export class SubmissionModule {}
