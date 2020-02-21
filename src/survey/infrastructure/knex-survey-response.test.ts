import { v4 as uuid } from 'uuid';
import * as Knex from 'knex';
import { KnexSurveyResponseRepository } from './knex-survey-response';
import { SurveyId, SurveyResponseId } from '../survey';
import { SubmissionId } from '../../submission/types';
import { MockKnex, createMockAdapter } from '../../test-mocks/knex-mock';
import { SurveyResponse } from '../models/survey-response';
import { KnexTableAdapter } from '../../knex-table-adapter';

const testSurveyResponse = new SurveyResponse({
    id: SurveyResponseId.fromUuid(uuid()),
    surveyId: SurveyId.fromUuid(uuid()),
    submissionId: SubmissionId.fromUuid(uuid()),
    questions: [],
    answers: [],
});

describe('Knex SurveyResponse Repository', () => {
    let adapter: KnexTableAdapter;
    let mock: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mock = new MockKnex();
        adapter = createMockAdapter(mock);
    });

    it('Can save', async () => {
        adapter.executor = jest.fn();
        const repo = new KnexSurveyResponseRepository(adapter);
        const result = await repo.create(testSurveyResponse);
        expect(mock.insert).toBeCalled();
        expect(result).toMatchObject({
            id: testSurveyResponse.id,
            surveyId: testSurveyResponse.surveyId,
            submissionId: testSurveyResponse.submissionId,
            questions: [],
            answers: [],
        });
    });
});
