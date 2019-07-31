import { Question } from "./question";
import { Answer } from "./answer";

export interface SurveyResponseRepository {
  save(surveyResponse: ISurveyResponse): Promise<ISurveyResponse>;
}

export interface ISurveyResponse {
  id: string;
  surveyId: string;
  submissionId: string;
  questions: Array<Question>;
  answers: Array<Answer>;
  answerQuestion(questionId: string, questionText: string, answerText: string);
  toDTO(): object;
}
