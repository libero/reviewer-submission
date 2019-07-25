import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionsResolver } from './submissions.resolver';
import { Submission } from './domain/submission.entity';
import { SubmissionService } from './use-cases/submission.service';
import { GqlAuthGuard } from '../auth/graphql.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Submission]), GqlAuthGuard],
  providers: [SubmissionService, SubmissionsResolver],
})

export class SubmissionModule {}
