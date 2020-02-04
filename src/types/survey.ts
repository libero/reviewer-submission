import { Question } from '../entities/question';
import { Answer } from '../entities/answer';
import { uuidType } from 'typesafe-uuid';
import { SubmissionId } from './submission';

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
