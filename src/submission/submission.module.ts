import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsResolver } from './submissions.resolver';
import { Submission } from './submission.entity';
import { SubmissionService } from './submission.service';

@Module({
  imports: [TypeOrmModule.forFeature([Submission])],
  providers: [SubmissionService, SubmissionsResolver],
})

export class SubmissionModule {}
