import { Question } from './question';
import { Answer } from './answer';
import { uuidType } from 'typesafe-uuid';
import { SubmissionId } from '../types/submission.types';

export class SurveyId extends uuidType<'SurveyId'>() {}
export class SurveyResponseId extends uuidType<'SurveyResponseId'>() {}

export interface SurveyResponseRepository {
    save(surveyResponse: ISurveyResponse): Promise<ISurveyResponse>;
    close(): void;
}

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
