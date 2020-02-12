import { v4 as uuid } from 'uuid';
import * as Knex from 'knex';
import { KnexSurveyResponseRepository } from './knex-survey-response';
import { SurveyId, SurveyResponseId } from '../survey';
import { SubmissionId } from '../../submission/submission';
import { MockKnex } from '../../test-mocks/knex-mock';
import { SurveyResponse } from '../models/survey-response';

const testSurveyResponse = new SurveyResponse({
    id: SurveyResponseId.fromUuid(uuid()),
    surveyId: SurveyId.fromUuid(uuid()),
    submissionId: SubmissionId.fromUuid(uuid()),
    questions: [],
    answers: [],
});

describe('Knex SurveyResponse Repository', () => {
    let mockKnex: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mockKnex = new MockKnex();
        mockKnex.insert = jest.fn().mockReturnValue(mockKnex);
        mockKnex.withSchema = jest.fn().mockReturnValue(mockKnex);
        mockKnex.into = jest.fn().mockReturnValue(mockKnex);
    });

    it('Can save', () => {
        const repo = new KnexSurveyResponseRepository((mockKnex as unknown) as Knex);
        return expect(repo.save(testSurveyResponse)).resolves.toMatchObject({
            id: testSurveyResponse.id,
            surveyId: testSurveyResponse.surveyId,
            submissionId: testSurveyResponse.submissionId,
            questions: [],
            answers: [],
        });
    });
});
