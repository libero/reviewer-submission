import { Question } from './models/question';
import { Answer } from './models/answer';
import { uuidType } from 'typesafe-uuid';
import { SubmissionId } from '../submission/submission';

export class SurveyId extends uuidType<'SurveyId'>() {}
export class SurveyResponseId extends uuidType<'SurveyResponseId'>() {}

export interface SurveyResponseRepository {
    save(surveyResponse: ISurveyResponse): Promise<ISurveyResponse>;
    close(): void;
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
