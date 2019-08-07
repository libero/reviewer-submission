import { Question } from './question';
import { Answer } from './answer';
import { uuidType } from '../core';
import { SubmissionId } from '../submission/submission.repository';

// tslint:disable:max-classes-per-file
export class SurveyId extends uuidType<'SurveyId'>() {}
export class SurveyResponseId extends uuidType<'SurveyResponseId'>() {}

export interface SurveyResponseRepository {
  save(surveyResponse: ISurveyResponse): Promise<ISurveyResponse>;
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
