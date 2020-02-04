import { SurveyService } from '../services/survey.service';
import { SurveyResponse } from 'src/types/survey-response.entity';
import { SurveyId } from '../types/survey.types';
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
