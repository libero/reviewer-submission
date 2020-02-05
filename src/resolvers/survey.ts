import { IResolvers } from 'apollo-server-express';
import { SurveyService } from '../services/survey';
import { SurveyId, SurveyResponseDTO } from '../types/survey';
import { SubmissionId } from '../types/submission';
import { SurveyAnswer } from '../entities/survey-answer';

const resolvers = (surveyService: SurveyService): IResolvers => ({
    Mutation: {
        // Using the SurveyAnswer data container class. Should it be an interface instead?
        async submitSurveyResponse(
            _,
            args: { surveyId: string; submissionId: string; answers: SurveyAnswer[] },
        ): Promise<SurveyResponseDTO> {
            const { surveyId, submissionId, answers } = args;
            const surveyResponse = await surveyService.submitResponse(
                SurveyId.fromUuid(surveyId),
                SubmissionId.fromUuid(submissionId),
                answers,
            );

            return surveyResponse.toDTO();
        },
    },
});

export const SurveyResolvers = resolvers;
