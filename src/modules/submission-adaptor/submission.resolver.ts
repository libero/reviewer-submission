import {
  Args,
  Info,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { Uuid } from '../../core';
import { UseGuards } from '@nestjs/common';
import { Submission } from '../../packages/submission/submission.entity';
import { ISubmission } from '../../packages/submission/submission.repository';
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
  async getSubmission(@Args('id') id: string): Promise<ISubmission> {
    return (await this.submissionService.findOne(id)).toDTO();
  }

  @Mutation('startSubmission')
  async startSubmission(): Promise<ISubmission> {
    return await this.submissionService.start();
  }

  @Mutation('changeSubmissionTitle')
  async changeSubmissionTitle(@Args('id') id: string, @Args('title') title: string): Promise<Submission> {
    return await this.submissionService.changeTitle(id, title);
  }

  @Mutation('deleteSubmission')
  async deleteSubmission(@Args('id') id: Uuid): Promise<boolean> {
    return await this.submissionService.deleteSubmission(id);
  }
}
