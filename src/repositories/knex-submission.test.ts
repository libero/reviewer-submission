import { v4 as uuid } from 'uuid';
import * as Knex from 'knex';
import { KnexSubmissionRepository } from './knex-submission';
import { SubmissionId } from '../types/submission';
import { MockKnex } from './knex-mock';


describe('Knex Submission Repository', () => {
    let mockKnex: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks()
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
        const id = SubmissionId.fromUuid(uuid());
        mockKnex.where = jest.fn().mockReturnValue(mockKnex);
        const repo = new KnexSubmissionRepository((mockKnex as unknown) as Knex);
        expect(repo.findById(id)).resolves.toEqual(1);
    });
/*
    it('Can findAll', () => {
        const repo = new KnexSubmissionRepository((mockKnex as unknown) as Knex);
        expect(repo.findAll()).resolves.toEqual(true);
    });
*/
    it('Can save', () => {
        const id = SubmissionId.fromUuid(uuid());
        const submission = {
            id: id,
            title: '',
            status: 'INITIAL',
            createdBy: '123',
            updated: new Date(),
            articleType: '',
        };

        const repo = new KnexSubmissionRepository((mockKnex as unknown) as Knex);
        expect(repo.save(submission)).resolves.toEqual(submission);
        expect(mockKnex.withSchema).toBeCalledWith('public');
        expect(mockKnex.into).toBeCalledWith('manuscript');
        expect(mockKnex.returning).toBeCalledWith('id');
    });
});
