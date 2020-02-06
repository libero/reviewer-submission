import * as Knex from 'knex';
import { KnexSurveyResponseRepository } from '../repositories/survey-response';
import { SurveyAnswer } from '../entities/survey-answer';
import { SurveyResponse } from '../entities/survey-response';
import { SurveyId, SurveyResponseId } from '../types/survey';
import { SubmissionId } from '../types/submission';
import uuid = require('uuid');

export class SurveyService {
    surveyResponseRepository: KnexSurveyResponseRepository;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        this.surveyResponseRepository = new KnexSurveyResponseRepository(knexConnection);
    }

    async submitResponse(
        surveyId: SurveyId,
        submissionId: SubmissionId,
        answers: SurveyAnswer[],
    ): Promise<SurveyResponse> {
        const id: SurveyResponseId = SurveyResponseId.fromUuid(uuid());
        const surveyResponse = new SurveyResponse({
            id,
            surveyId,
            submissionId,
        });

        answers.forEach(({ questionId, text, answer }: SurveyAnswer) => {
            surveyResponse.answerQuestion(questionId, text, answer);
        });

        return await this.surveyResponseRepository.save(surveyResponse);
    }
}
