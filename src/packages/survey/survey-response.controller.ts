import { v4 as uuid } from 'uuid';
import { None, Option, Some } from 'funfix';
import { SurveyResponse } from './survey-response.entity';
import { SurveyResponseRepository } from './survey-response.repository';
import { Uuid } from '../../core';
import { SurveyAnswer } from './survey-answer';

export class SurveyResponseController {
  repository: Option<SurveyResponseRepository> = None;

  constructor(repository: SurveyResponseRepository) {
    this.repository = Option.of(repository);
  }

  async submitResponse(
    surveyId: string,
    submissionId: string,
    answers: SurveyAnswer[],
  ): Promise<SurveyResponse> {
    const surveyResponse = new SurveyResponse({
      id: uuid() as Uuid,
      surveyId,
      submissionId,
    });

    answers.forEach(({ questionId, text, answer }: SurveyAnswer) => {
      surveyResponse.answerQuestion(questionId, text, answer);
    });

    return await this.repository
      .map(async repository => await repository.save(surveyResponse))
      .get();
  }
}
