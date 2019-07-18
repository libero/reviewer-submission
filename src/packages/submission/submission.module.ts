import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsResolver } from './submissions.resolver';
import { Submission } from './domain/submission.entity';
import { SubmissionService } from './use-cases/submission.service';

@Module({
  imports: [TypeOrmModule.forFeature([Submission])],
  providers: [SubmissionService, SubmissionsResolver],
})

export class SubmissionModule {}
