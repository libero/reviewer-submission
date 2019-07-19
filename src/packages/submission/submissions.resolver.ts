
import {
  Args,
  Info,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { Submission } from './domain/submission.entity';
import { SubmissionService } from './use-cases/submission.service';

@Resolver()
export class SubmissionsResolver {
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
    return await this.submissionService.findOne(id);
  }

  @Mutation('startSubmission')
  async startSubmission(): Promise<Submission> {
    return await this.submissionService.start();
  }

  @Mutation('changeSubmissionTitle')
  async changeSubmissionTitle(@Args('id') id: string, @Args('title') title: string): Promise<Submission> {
    return await this.submissionService.changeTitle(id, title);
  }
}
