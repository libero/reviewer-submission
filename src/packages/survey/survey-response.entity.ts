import { ISurveyResponse } from './survey-response.repository';
import { Question } from './question';
import { Answer } from './answer';

export class SurveyResponse implements ISurveyResponse {
  id: string;

  surveyId: string;

  submissionId: string;

  questions: Question[];

  answers: Answer[];

  constructor(
    id: string,
    surveyId: string,
    submissionId: string,
    questions: Question[] = [],
    answers: Answer[] = [],
  ) {
    this.id = id;
    this.surveyId = surveyId;
    this.submissionId = submissionId;
    this.questions = questions;
    this.answers = answers;
  }

  // store the answer to a question along with the question text, replacing it if one already exists
  answerQuestion(questionId: string, questionText: string, answerText: string) {
    const newAnswer = new Answer(questionId, answerText);
    const newQuestion = new Question(questionId, questionText);

    const answerIndex = this.answers.findIndex(answer => answer.questionId === questionId);
    answerIndex !== -1 ? this.answers.splice(answerIndex, 1, newAnswer) : this.answers.push(newAnswer);

    const questionIndex = this.questions.findIndex(question => question.id === questionId);
    questionIndex !== -1 ? this.questions.splice(questionIndex, 1, newQuestion) : this.questions.push(newQuestion);
  }

  // should we maybe have a SurveyResponseDTO ?
  toDTO(): object {
    return {
      id: this.id,
      surveyId: this.surveyId,
      submissionId: this.submissionId,
      response: {
        questions: this.questions,
        answers: this.answers,
      },
    };
  }
}
