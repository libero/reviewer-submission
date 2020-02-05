import { IResolvers } from 'apollo-server-express';
import { SurveyService } from '../services/survey';
import { SurveyResponse } from 'src/entities/survey-response';
import { SurveyId } from '../types/survey';
import { SubmissionId } from '../types/submission';
import { SurveyAnswer } from '../entities/survey-answer';

const resolvers = (surveyService: SurveyService): IResolvers => ({
    Query: {},
    Mutation: {
        // Using the SurveyAnswer data container class. Should it be an interface instead?
        async submitSurveyResponse(
            surveyId: string,
            submissionId: string,
            answers: SurveyAnswer[],
        ): Promise<SurveyResponse> {
            return surveyService.submitResponse(
                SurveyId.fromUuid(surveyId),
                SubmissionId.fromUuid(submissionId),
                answers,
            );
        },
    },
});

export const SurveyResolvers = resolvers;
