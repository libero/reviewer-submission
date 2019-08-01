import { Question } from './question';
import { Answer } from './answer';
import { Uuid } from '../../core';
// import { SubmissionId } from '../submission/submission.repository';

// export class SurveyId extends branded<string, 'Uuid'>() {}
// export class SurveyResponseId extends branded<string, 'Uuid'>() {}
// export type SurveyId = Uuid;
// export type SurveyResponseId = Uuid;

export interface SurveyResponseRepository {
  save(surveyResponse: ISurveyResponse): Promise<ISurveyResponse>;
}

export interface ISurveyResponse {
  id: Uuid;
  surveyId: Uuid;
  submissionId: Uuid;
  questions: Question[];
  answers: Answer[];
  answerQuestion(questionId: string, questionText: string, answerText: string): void;
  toDTO(): SurveyResponseDTO;
}

export interface SurveyResponseDTO {
  id: Uuid;
  surveyId: Uuid;
  submissionId: Uuid;
  response: {
    questions: Question[];
    answers: Answer[];
  };
}
