import { Module } from '@nestjs/common';
import { SubmissionResolver } from './submission.resolver';
import { Submission } from '../../packages/submission/submission.entity';
import { SubmissionService } from './submission.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [SubmissionService, SubmissionResolver],
})

export class SubmissionModule {}
