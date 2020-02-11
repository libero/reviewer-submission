import { v4 as uuid } from 'uuid';
import * as Knex from 'knex';
import { KnexSubmissionRepository } from './knex-submission';
import { SubmissionId } from '../types/submission';
import { MockKnex } from './knex-mock';
import { SubmissionMapper } from '../entities/submission';

const testSubmission = {
    id: SubmissionId.fromUuid(uuid()),
    title: 'The title',
    status: 'INITIAL',
    createdBy: '123',
    updated: new Date(),
    articleType: 'newspaper',
};

const testSubmission2 = {
    id: SubmissionId.fromUuid(uuid()),
    title: 'Another title',
    status: 'INITIAL',
    createdBy: '124',
    updated: new Date(),
    articleType: 'journal',
};

const testSubmissionItems = [SubmissionMapper.toDto(testSubmission), SubmissionMapper.toDto(testSubmission2)];

describe('Knex Submission Repository', () => {
    let mockKnex: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mockKnex = new MockKnex();
        mockKnex.insert = jest.fn().mockReturnValue(mockKnex);
        mockKnex.withSchema = jest.fn().mockReturnValue(mockKnex);
        mockKnex.into = jest.fn().mockReturnValue(mockKnex);
        mockKnex.select = jest.fn().mockReturnValue(mockKnex);
        mockKnex.from = jest.fn().mockReturnValue(mockKnex);
        mockKnex.where = jest.fn().mockReturnValue(mockKnex);
        mockKnex.returning = jest.fn().mockReturnValue(mockKnex);
    });

    it('delete returns true when successful', () => {
        mockKnex.delete = jest.fn().mockReturnValue(true);
        const id = SubmissionId.fromUuid(uuid());
        const repo = new KnexSubmissionRepository((mockKnex as unknown) as Knex);
        expect(repo.delete(id)).resolves.toEqual(true);
    });

    it('Can findById', () => {
        mockKnex.where = jest.fn().mockReturnValue(testSubmissionItems);
        const repo = new KnexSubmissionRepository((mockKnex as unknown) as Knex);
        return expect(repo.findById(testSubmission.id)).resolves.toMatchObject({
            id: testSubmission.id,
            title: 'The title',
            status: 'INITIAL',
            createdBy: '123',
            articleType: 'newspaper',
        });
    });

    it('Can findAll', async () => {
        mockKnex.from = jest.fn().mockReturnValue(testSubmissionItems);
        const repo = new KnexSubmissionRepository((mockKnex as unknown) as Knex);
        const result = await repo.findAll();
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            id: testSubmission.id,
            title: 'The title',
            status: 'INITIAL',
            createdBy: '123',
            articleType: 'newspaper',
        });
        expect(result[1]).toMatchObject({
            id: testSubmission2.id,
            title: 'Another title',
            status: 'INITIAL',
            createdBy: '124',
            articleType: 'journal',
        });
    });

    it('Can save', async () => {
        const repo = new KnexSubmissionRepository((mockKnex as unknown) as Knex);
        await expect(repo.save(testSubmission)).resolves.toMatchObject({
            id: testSubmission.id,
            title: 'The title',
            status: 'INITIAL',
            createdBy: '123',
            articleType: 'newspaper',
        });
        expect(mockKnex.withSchema).toBeCalledWith('public');
        expect(mockKnex.into).toBeCalledWith('manuscript');
        expect(mockKnex.returning).toBeCalledWith('id');
    });
});
