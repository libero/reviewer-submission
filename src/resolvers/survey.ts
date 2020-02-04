import { SurveyService } from '../services/survey';
import { SurveyResponse } from 'src/entities/survey-response';
import { SurveyId } from '../types/survey';
import { SubmissionId } from '../types/submission.types';
import { SurveyAnswer } from 'src/types/survey-answer';

// TODO: type this
const resolvers = (surveyService: SurveyService): any => ({
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

export default resolvers;
