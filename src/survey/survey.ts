import { Question } from './models/question';
import { Answer } from './models/answer';
import { uuidType } from 'typesafe-uuid';
import { SubmissionId } from '../submission/types';

export class SurveyId extends uuidType<'SurveyId'>() {}
export class SurveyResponseId extends uuidType<'SurveyResponseId'>() {}

export interface SurveyResponseRepository {
    create(surveyResponse: ISurveyResponse): Promise<ISurveyResponse>;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ISurveyResponse {
    id: SurveyResponseId;
    surveyId: SurveyId;
    submissionId: SubmissionId;
    questions: Question[];
    answers: Answer[];
    answerQuestion(questionId: string, questionText: string, answerText: string): void;
    toDTO(): SurveyResponseDTO;
}

export interface SurveyResponseDTO {
    id: SurveyResponseId;
    surveyId: SurveyId;
    submissionId: SubmissionId;
    response: {
        questions: Question[];
        answers: Answer[];
    };
}
