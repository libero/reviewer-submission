import { IResolvers } from 'apollo-server-express';
import { SurveyService } from '../services/survey';
import { SurveyResponse } from '../entities/survey-response';
import { SurveyId } from '../types/survey';
import { SubmissionId } from '../types/submission';
import { SurveyAnswer } from '../entities/survey-answer';

const resolvers = (surveyService: SurveyService): IResolvers => ({
    Query: {},
    Mutation: {
        // Using the SurveyAnswer data container class. Should it be an interface instead?
        async submitSurveyResponse(
            _,
            args: { surveyId: string; submissionId: string; answers: SurveyAnswer[] },
        ): Promise<SurveyResponse> {
            const { surveyId, submissionId, answers } = args;
            return surveyService.submitResponse(
                SurveyId.fromUuid(surveyId),
                SubmissionId.fromUuid(submissionId),
                answers,
            );
        },
    },
});

export const SurveyResolvers = resolvers;
