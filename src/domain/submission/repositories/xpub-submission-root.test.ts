/* eslint-disable @typescript-eslint/camelcase */
import { v4 as uuid } from 'uuid';
import XpubSubmissionRootRepository from './xpub-submission-root';
import { SubmissionId } from '../types';
import { SubmissionDTO } from './types';
import { createMockAdapter, MockKnex } from '../../test-mocks/knex-mock';
import { KnexTableAdapter } from '../../knex-table-adapter';

const entryId = SubmissionId.fromUuid(uuid());
const entryId2 = SubmissionId.fromUuid(uuid());

const testDatabaseEntry = {
    id: entryId,
    meta: {
        title: 'The title',
        articleType: 'newspaper',
    },
    status: 'INITIAL',
    created_by: '123',
    updated: new Date('2020-02-18T15:14:53.155Z'),
};

const testDatabaseEntry2 = {
    id: entryId2,
    meta: {
        title: 'Another title',
        articleType: 'journal',
    },
    status: 'INITIAL',
    created_by: '124',
    updated: new Date('2020-02-18T15:14:53.155Z'),
};

const databaseEntries = [testDatabaseEntry, testDatabaseEntry2];

describe('Knex Submission Repository', () => {
    let adapter: KnexTableAdapter;
    let mock: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mock = new MockKnex();
        adapter = createMockAdapter(mock);
    });

    describe('findAll', () => {
        it('returns the correct number of entries', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.findAll();
            expect(result).toHaveLength(2);
        });
        it('returns a converted DTO object from the database entries', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.findAll();
            expect(mock.select).toBeCalled();
            expect(mock.from).toBeCalled();
            expect(result[0]).toStrictEqual({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
                updated: new Date('2020-02-18T15:14:53.155Z'),
            });
            expect(result[1]).toStrictEqual({
                id: entryId2,
                title: 'Another title',
                status: 'INITIAL',
                createdBy: '124',
                articleType: 'journal',
                updated: new Date('2020-02-18T15:14:53.155Z'),
            });
        });
        it('calls the knex instance methods with the correct parameters', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository(adapter);
            await repo.findAll();
            expect(mock.select).toBeCalledWith('id', 'updated', 'created_by', 'status', 'meta');
            expect(mock.from).toBeCalledWith('manuscript');
        });
    });
    describe('findById', () => {
        it('returns a converted DTO object from the database entry', () => {
            adapter.executor = jest.fn().mockReturnValue([databaseEntries[0]]);
            const repo = new XpubSubmissionRootRepository(adapter);
            return expect(repo.findById(entryId)).resolves.toStrictEqual({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
                updated: new Date('2020-02-18T15:14:53.155Z'),
            });
        });
        it('returns the first entry if multiple entries are found by query', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.findById(entryId);
            expect((result as SubmissionDTO).id).toEqual(databaseEntries[0].id);
        });
        it('returns null on no submission found', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue([]);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.findById(entryId);
            expect(result).toBeNull();
        });
        it('calls the knex instance methods with the correct parameters', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue([]);
            const repo = new XpubSubmissionRootRepository(adapter);
            await repo.findById(entryId);
            expect(mock.select).toBeCalledWith('id', 'updated', 'created_by', 'status', 'meta');
            expect(mock.from).toBeCalledWith('manuscript');
            expect(mock.where).toBeCalledWith({ id: entryId });
        });
    });

    describe('update', () => {
        it('calls update on knex if the entry exists', async (): Promise<void> => {
            adapter.executor = jest.fn();
            const repo = new XpubSubmissionRootRepository(adapter);
            repo.findById = jest.fn().mockReturnValue({ id: '1' });
            expect(mock.update).toBeCalledTimes(0);
            await repo.update({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
            expect(mock.update).toBeCalledTimes(1);
            expect(mock.insert).toBeCalledTimes(0);
        });
        it('updates the updated time of the entry', async (): Promise<void> => {
            const lastUpdated = databaseEntries[0].updated;
            // https://jestjs.io/docs/en/mock-functions.html#mock-return-values
            adapter.executor = jest
                .fn()
                .mockReturnValueOnce([testDatabaseEntry])
                .mockReturnValueOnce(true);
            const repo = new XpubSubmissionRootRepository(adapter);
            const { updated } = await repo.update({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
            expect(updated).not.toEqual(lastUpdated);
        });
        it('returns a complete DTO when passed a partial to update', async (): Promise<void> => {
            // https://jestjs.io/docs/en/mock-functions.html#mock-return-values
            adapter.executor = jest
                .fn()
                .mockReturnValueOnce([testDatabaseEntry])
                .mockReturnValueOnce(true);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.update({
                id: entryId,
                title: 'A Different Title',
            });
            expect(result).toMatchObject({
                id: entryId,
                title: 'A Different Title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
        });
    });
    describe('create', () => {
        it('calls insert on knex', async (): Promise<void> => {
            adapter.executor = jest.fn();
            const repo = new XpubSubmissionRootRepository(adapter);
            repo.findById = jest.fn().mockReturnValue(null);
            expect(mock.insert).toBeCalledTimes(0);
            await repo.create({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
            expect(mock.insert).toBeCalledTimes(1);
            expect(mock.into).toBeCalledTimes(1);
            expect(mock.update).toBeCalledTimes(0);
        });
        it('returns a complete DTO when passed a complete DTO to create', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue([]);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.create({
                id: entryId,
                title: 'A Different Title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
            expect(result).toMatchObject({
                id: entryId,
                title: 'A Different Title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
        });
    });
    describe('delete', () => {
        it('returns true when knex delete is successful', () => {
            adapter.executor = jest.fn().mockReturnValue(true);
            const repo = new XpubSubmissionRootRepository(adapter);
            expect(repo.delete(SubmissionId.fromUuid(uuid()))).resolves.toEqual(true);
        });
        it('returns false when knex delete is not successful', () => {
            adapter.executor = jest.fn().mockReturnValue(false);
            const repo = new XpubSubmissionRootRepository(adapter);
            expect(repo.delete(SubmissionId.fromUuid(uuid()))).resolves.toEqual(false);
        });
    });
});
