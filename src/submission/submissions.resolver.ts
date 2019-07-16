
import {
  Args,
  Info,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';

@Resolver()
export class SubmissionsResolver {
  @Query('getSubmissions')
  async getSubmissions(@Args() args, @Info() info): Promise<any> {
    return [{
      id: 'some-id',
      title: 'somie-title',
      // created: new Date().toISOString()
    }]
  }
}
