
import {
  Args,
  Info,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { Submission } from './submission.entity';
import { SubmissionService } from './submission.service';

@Resolver()
export class SubmissionsResolver {
  constructor(
    private readonly submissionService: SubmissionService,
  ) {
  }

  @Query('getSubmissions')
  async getSubmissions(@Args() args, @Info() info): Promise<Submission[]> {
    return await this.submissionService.findAll();
  }

  @Mutation('writeSubmission')
  async writeSubmission(@Args() args, @Info() info): Promise<string> {
    return await this.submissionService.insertOne();
  }
}
