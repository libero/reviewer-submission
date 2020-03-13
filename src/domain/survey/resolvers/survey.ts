import { IResolvers } from 'apollo-server-express';
import { SurveyService } from '../services/survey-service';
import { SurveyId } from '../survey';
import { SubmissionId } from '../../submission/types';
import { SurveyAnswer } from '../services/models/survey-answer';
import { SurveyResponse } from '../services/models/survey-response';

const resolvers = (surveyService: SurveyService): IResolvers => ({
    Mutation: {
        // Using the SurveyAnswer data container class. Should it be an interface instead?
        async submitSurveyResponse(
            _,
            args: { surveyId: string; submissionId: string; answers: SurveyAnswer[] },
        ): Promise<SurveyResponse> {
            const { surveyId, submissionId, answers } = args;
            const surveyResponse = await surveyService.submitResponse(
                SurveyId.fromUuid(surveyId),
                SubmissionId.fromUuid(submissionId),
                answers,
            );

            return surveyResponse;
        },
    },
});

export const SurveyResolvers = resolvers;
