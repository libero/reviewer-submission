import { v4 as uuid } from 'uuid';
import { None, Option, Some } from 'funfix';
import { SurveyResponse } from './survey-response.entity';
import { SurveyResponseRepository, SurveyId, SurveyResponseId } from './survey-response.repository';
import { SurveyAnswer } from './survey-answer';
import { SubmissionId } from '../submission/submission.repository';

export class SurveyResponseController {
  repository: Option<SurveyResponseRepository> = None;

  constructor(repository: SurveyResponseRepository) {
    this.repository = Option.of(repository);
  }

  async submitResponse(
    surveyId: SurveyId,
    submissionId: SubmissionId,
    answers: SurveyAnswer[],
  ): Promise<SurveyResponse> {
    const id : SurveyResponseId = SurveyResponseId.fromUuid(uuid());
    const surveyResponse = new SurveyResponse({
      id: id,
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
