import { Module } from '@nestjs/common';
import { SubmissionsResolver } from './submissions.resolver'

@Module({
  providers: [SubmissionsResolver]
})
export class SubmissionModule {}
