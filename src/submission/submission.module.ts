import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsResolver } from './submissions.resolver';
import { Submission } from './submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Submission])],
  providers: [SubmissionsResolver]
})

export class SubmissionModule {}
