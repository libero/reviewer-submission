import * as Knex from 'knex';
import { KnexSurveyResponseRepository } from '../repositories/knex-survey-response';
import { SurveyAnswer } from './models/survey-answer';
import { SurveyResponse } from './models/survey-response';
import { SurveyId, SurveyResponseId } from '../survey';
import { SubmissionId } from '../../submission/types';
import uuid = require('uuid');
import { createKnexAdapter } from '../../knex-table-adapter';

export class SurveyService {
    surveyResponseRepository: KnexSurveyResponseRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.surveyResponseRepository = new KnexSurveyResponseRepository(adapter);
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

        return await this.surveyResponseRepository.create(surveyResponse);
    }
}
