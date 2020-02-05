import * as Knex from 'knex';
import { KnexSurveyResponseRepository } from '../repositories/survey-response';
import { SurveyAnswer } from 'src/entities/survey-answer';
import { SurveyResponse } from 'src/entities/survey-response';
import { SurveyId, SurveyResponseId } from '../types/survey';
import { SubmissionId } from '../types/submission';
import uuid = require('uuid');
// REMOVE - MAYBE? PROBABLY!

export class SurveyService {
    surveyResponseRepository: KnexSurveyResponseRepository;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        this.surveyResponseRepository = new KnexSurveyResponseRepository(knexConnection);
    }

    // TODO: revisit this.
    // again, do we use SurveyAnswer or an interface?
    async submitResponse(
        surveyId: SurveyId,
        submissionId: SubmissionId,
        answers: SurveyAnswer[],
    ): Promise<SurveyResponse> {
        // return this.surveyResponseRepository.save(surveyId, submissionId, answers);
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
