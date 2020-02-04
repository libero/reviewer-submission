import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SurveyService } from '../../services/survey.service';
import { SurveyResponse } from 'src/packages/survey/survey-response.entity';
import { SurveyId } from 'src/packages/survey/survey-response.repository';
import { SubmissionId } from '../../types/submission.types';
import { SurveyAnswer } from 'src/packages/survey/survey-answer';

@Resolver()
export class SurveyResolver {
    constructor(private readonly surveyService: SurveyService) {}

    @Mutation('submitSurveyResponse')
    // Using the SurveyAnswer data container class. Should it be an interface instead?
    async submitSurveyResponse(
        @Args('surveyId') surveyId: string,
        @Args('submissionId') submissionId: string,
        @Args('answers') answers: SurveyAnswer[],
    ): Promise<SurveyResponse> {
        return this.surveyService.submitResponse(
            SurveyId.fromUuid(surveyId),
            SubmissionId.fromUuid(submissionId),
            answers,
        );
    }
}
