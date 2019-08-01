import {
  Args,
  Info,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Submission } from '../../packages/submission/submission.entity';
import { SubmissionId } from '../../packages/submission/submission.repository';
import { SubmissionService } from './submission.service';

@Resolver()
export class SubmissionResolver {
  constructor(
    private readonly submissionService: SubmissionService,
  ) {
  }

  @Query('getSubmissions')
  async getSubmissions(): Promise<Submission[]> {
    return await this.submissionService.findAll();
  }

  @Query('getSubmission')
  async getSubmission(@Args('id') id: string): Promise<Submission> {
    return await this.submissionService.findOne(SubmissionId.fromUuid(id));
  }

  @Mutation('startSubmission')
  async startSubmission(): Promise<Submission> {
    return await this.submissionService.start();
  }

  @Mutation('changeSubmissionTitle')
  async changeSubmissionTitle(@Args('id') id: string, @Args('title') title: string): Promise<Submission> {
    return await this.submissionService.changeTitle(SubmissionId.fromUuid(id), title);
  }
}
