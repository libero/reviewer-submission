import { SurveyService } from './survey-service';
import { SubmissionId } from '../../submission/types';
import * as Knex from 'knex';
import * as uuid from 'uuid';

jest.mock('../../knex-table-adapter', () => ({
    createKnexAdapter: jest.fn(),
}));

jest.mock('../repositories/knex-survey-response', () => ({
    create: jest.fn(),
}));

jest.mock('../repositories/knex-survey-response');

const answerQuestionMock = jest.fn();

jest.mock('./models/survey-response', () => () => ({
    answerQuestion: answerQuestionMock,
}));

describe('survey-service', () => {
    beforeEach(() => {
        answerQuestionMock.mockReset();
    });
    it('skips null answer values', () => {
        const surveyService = new SurveyService(({} as unknown) as Knex);
        const submissionId = SubmissionId.fromUuid(uuid());
        surveyService.submitResponse('id', submissionId, [
            null,
            null,
            { questionId: 'id', text: 'sdfdsfsd', answer: 'ddgffg' },
        ]);
        expect(answerQuestionMock).toHaveBeenCalledTimes(1);
        expect(answerQuestionMock).toBeCalledWith('id', 'sdfdsfsd', 'ddgffg');
    });
});
