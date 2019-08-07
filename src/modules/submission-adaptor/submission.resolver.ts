import {
  Args,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { Submission } from '../../packages/submission/submission.entity';
import { SubmissionId } from '../../packages/submission/submission.repository';
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
    return (await this.submissionService.findOne(SubmissionId.fromUuid(id))).toDTO();
  }

  @Mutation('startSubmission')
  async startSubmission(): Promise<ISubmission> {
    return await this.submissionService.start();
  }

  @Mutation('changeSubmissionTitle')
  async changeSubmissionTitle(@Args('id') id: string, @Args('title') title: string): Promise<Submission> {
    return await this.submissionService.changeTitle(SubmissionId.fromUuid(id), title);
  }

  @Mutation('deleteSubmission')
  async deleteSubmission(@Args('id') id: SubmissionId): Promise<boolean> {
    return await this.submissionService.deleteSubmission(id);
  }
}
