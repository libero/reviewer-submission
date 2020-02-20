/* eslint-disable @typescript-eslint/camelcase */
import { v4 as uuid } from 'uuid';
import * as Knex from 'knex';
import XpubSubmissionRootRepository from './xpub-submission-root';
import { SubmissionId } from '../types';
import { SubmissionDTO } from './types';
import { MockKnex } from '../../test-mocks/knex-mock';

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
    let mockKnex: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mockKnex = new MockKnex();
        mockKnex.insert = jest.fn().mockReturnValue(mockKnex);
        mockKnex.withSchema = jest.fn().mockReturnValue(mockKnex);
        mockKnex.into = jest.fn().mockReturnValue(mockKnex);
        mockKnex.update = jest.fn().mockReturnValue(mockKnex);
        mockKnex.select = jest.fn().mockReturnValue(mockKnex);
        mockKnex.from = jest.fn().mockReturnValue(mockKnex);
        mockKnex.where = jest.fn().mockReturnValue(mockKnex);
        mockKnex.returning = jest.fn().mockReturnValue(mockKnex);
    });

    describe('findAll', () => {
        it('returns the correct number of entries', async (): Promise<void> => {
            mockKnex.from = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            const result = await repo.findAll();
            expect(result).toHaveLength(2);
        });
        it('returns a converted DTO object from the database entries', async (): Promise<void> => {
            mockKnex.from = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            const result = await repo.findAll();
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
            mockKnex.from = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            await repo.findAll();
            expect(mockKnex.withSchema).toBeCalledWith('public');
            expect(mockKnex.select).toBeCalledWith('id', 'updated', 'created_by', 'status', 'meta');
            expect(mockKnex.from).toBeCalledWith('manuscript');
        });
    });
    describe('findById', () => {
        it('returns a converted DTO object from the database entry', () => {
            mockKnex.where = jest.fn().mockReturnValue([databaseEntries[0]]);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
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
            mockKnex.where = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            const result = await repo.findById(entryId);
            expect((result as SubmissionDTO).id).toEqual(databaseEntries[0].id);
        });
        it('returns null on no submission found', async (): Promise<void> => {
            mockKnex.where = jest.fn().mockReturnValue([]);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            const result = await repo.findById(entryId);
            expect(result).toBeNull();
        });
        it('calls the knex instance methods with the correct parameters', async (): Promise<void> => {
            mockKnex.where = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            await repo.findById(entryId);
            expect(mockKnex.withSchema).toBeCalledWith('public');
            expect(mockKnex.select).toBeCalledWith('id', 'updated', 'created_by', 'status', 'meta');
            expect(mockKnex.from).toBeCalledWith('manuscript');
            expect(mockKnex.where).toBeCalledWith({ id: entryId });
        });
    });

    describe('update', () => {
        it('calls update on knex if the entry exists', async (): Promise<void> => {
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            repo.findById = jest.fn().mockReturnValue({ id: '1' });
            expect(mockKnex.update).toBeCalledTimes(0);
            await repo.update({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
            expect(mockKnex.update).toBeCalledTimes(1);
            expect(mockKnex.insert).toBeCalledTimes(0);
        });
        it('updates the updated time of the entry', async (): Promise<void> => {
            const lastUpdated = databaseEntries[0].updated;
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            repo.findById = jest.fn().mockReturnValue({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
                updated: lastUpdated,
            });
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
            const lastUpdated = databaseEntries[0].updated;
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            repo.findById = jest.fn().mockReturnValue({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
                updated: lastUpdated,
            });
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
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            repo.findById = jest.fn().mockReturnValue(null);
            expect(mockKnex.insert).toBeCalledTimes(0);
            await repo.create({
                id: entryId,
                title: 'The title',
                status: 'INITIAL',
                createdBy: '123',
                articleType: 'newspaper',
            });
            expect(mockKnex.insert).toBeCalledTimes(1);
            expect(mockKnex.update).toBeCalledTimes(0);
        });
        it('returns a complete DTO when passed a complete DTO to create', async (): Promise<void> => {
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
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
            mockKnex.delete = jest.fn().mockReturnValue(true);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            expect(repo.delete(SubmissionId.fromUuid(uuid()))).resolves.toEqual(true);
        });
        it('returns false when knex delete is not successful', () => {
            mockKnex.delete = jest.fn().mockReturnValue(false);
            const repo = new XpubSubmissionRootRepository((mockKnex as unknown) as Knex);
            expect(repo.delete(SubmissionId.fromUuid(uuid()))).resolves.toEqual(false);
        });
    });
});
