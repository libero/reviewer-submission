import {
  Args,
  Mutation,
  Resolver,
} from '@nestjs/graphql';
import { SurveyService } from './survey.service';
import { SurveyResponse } from 'src/packages/survey/survey-response.entity';
import { SurveyAnswer } from 'src/packages/survey/survey-answer';

@Resolver()
export class SurveyResolver {
  constructor(
    private readonly surveyService: SurveyService,
  ) {
  }

  @Mutation('submitSurveyResponse')
  // Using the SurveyAnswer data container class. Should it be an interface instead?
  async submitSurveyResponse(
    @Args('surveyId') surveyId: string,
    @Args('submissionId') submissionId: string,
    @Args('answers') answers: SurveyAnswer[],
  ): Promise<SurveyResponse> {
    return this.surveyService.submitResponse(surveyId, submissionId, answers);
  }
}
