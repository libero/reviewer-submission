
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

  @Mutation('createSubmission')
  async createSubmission(): Promise<Submission> {
    return await this.submissionService.create();
  }

  @Mutation('changeSubmissionTitle')
  async changeSubmissionTitle(@Args('id') id: string, @Args('title') title: string): Promise<Submission> {
    return await this.submissionService.changeTitle(id, title);
  }
}
