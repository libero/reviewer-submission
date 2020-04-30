/* eslint-disable @typescript-eslint/camelcase */
import { v4 as uuid } from 'uuid';
import XpubSubmissionRootRepository from './xpub-submission-root';
import { SubmissionId } from '../types';
import { createMockAdapter, MockKnex } from '../../test-mocks/knex-mock';
import { KnexTableAdapter } from '../../knex-table-adapter';
import Submission, { ArticleType, SubmissionStatus } from '../services/models/submission';

const entryId = SubmissionId.fromUuid(uuid());
const entryId2 = SubmissionId.fromUuid(uuid());

const testDatabaseEntry = {
    id: entryId,
    meta: {
        title: 'The title',
        articleType: ArticleType.FEATURE_ARTICLE,
    },
    cover_letter: 'test cover',
    status: SubmissionStatus.INITIAL,
    created_by: '123',
    updated: new Date('2020-02-18T15:14:53.255Z'),
    created: new Date('2020-02-18T15:14:53.155Z'),
};

const testDatabaseEntry2 = {
    id: entryId2,
    meta: {
        title: 'Another title',
        articleType: ArticleType.RESEARCH_ADVANCE,
    },
    cover_letter: 'test cover',
    status: SubmissionStatus.INITIAL,
    created_by: '124',
    updated: new Date('2020-02-18T15:14:53.255Z'),
    created: new Date('2020-02-18T15:14:53.155Z'),
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
        it('returns a submission model from the database entries', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.findAll();
            expect(mock.select).toBeCalled();
            expect(mock.from).toBeCalled();
            expect({ ...result[0] }).toStrictEqual({
                id: entryId,
                status: SubmissionStatus.INITIAL,
                createdBy: '123',
                articleType: ArticleType.FEATURE_ARTICLE,
                updated: new Date('2020-02-18T15:14:53.255Z'),
                created: new Date('2020-02-18T15:14:53.155Z'),
                disclosure: {},
                people: {},
                files: {
                    coverLetter: 'test cover',
                },
                manuscriptDetails: {
                    title: 'The title',
                    cosubmission: undefined,
                    previouslyDiscussed: undefined,
                    previouslySubmitted: undefined,
                    subjects: undefined,
                },
                suggestions: [],
            });
            expect({ ...result[1] }).toStrictEqual({
                id: entryId2,
                status: SubmissionStatus.INITIAL,
                createdBy: '124',
                articleType: ArticleType.RESEARCH_ADVANCE,
                updated: new Date('2020-02-18T15:14:53.255Z'),
                created: new Date('2020-02-18T15:14:53.155Z'),
                disclosure: {},
                people: {},
                files: {
                    coverLetter: 'test cover',
                },
                manuscriptDetails: {
                    title: 'Another title',
                    cosubmission: undefined,
                    previouslyDiscussed: undefined,
                    previouslySubmitted: undefined,
                    subjects: undefined,
                },
                suggestions: [],
            });
        });
        it('calls the knex instance methods with the correct parameters', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository(adapter);
            await repo.findAll();
            expect(mock.select).toBeCalledWith(
                'id',
                'created',
                'updated',
                'created_by',
                'status',
                'meta',
                'cover_letter',
                'opposed_senior_editors_reason',
                'opposed_reviewing_editors_reason',
                'opposed_reviewers_reason',
            );
            expect(mock.from).toBeCalledWith('manuscript');
        });
    });
    describe('findById', () => {
        it('returns a submission model from the database entry', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue([databaseEntries[0]]);
            const repo = new XpubSubmissionRootRepository(adapter);
            const submission = await repo.findById(entryId);
            expect({ ...submission }).toStrictEqual({
                id: entryId,
                status: SubmissionStatus.INITIAL,
                createdBy: '123',
                articleType: ArticleType.FEATURE_ARTICLE,
                updated: new Date('2020-02-18T15:14:53.255Z'),
                created: new Date('2020-02-18T15:14:53.155Z'),
                disclosure: {},
                people: {},
                files: {
                    coverLetter: 'test cover',
                },
                manuscriptDetails: {
                    title: 'The title',
                    cosubmission: undefined,
                    previouslyDiscussed: undefined,
                    previouslySubmitted: undefined,
                    subjects: undefined,
                },
                suggestions: [],
            });
        });
        it('returns the first entry if multiple entries are found by query', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.findById(entryId);
            expect((result as Submission).id).toEqual(databaseEntries[0].id);
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
            expect(mock.select).toBeCalledWith(
                'id',
                'created',
                'updated',
                'created_by',
                'status',
                'meta',
                'cover_letter',
                'opposed_senior_editors_reason',
                'opposed_reviewing_editors_reason',
                'opposed_reviewers_reason',
            );
            expect(mock.from).toBeCalledWith('manuscript');
            expect(mock.where).toBeCalledWith({ id: entryId });
        });
    });

    describe('update', () => {
        it('calls update on knex if the entry exists', async (): Promise<void> => {
            const submission = new Submission({
                id: entryId,
                status: SubmissionStatus.INITIAL,
                createdBy: '123',
                articleType: ArticleType.FEATURE_ARTICLE,
            });
            adapter.executor = jest.fn();
            const repo = new XpubSubmissionRootRepository(adapter);
            repo.findById = jest.fn().mockReturnValue({ id: '1' });
            expect(mock.update).toBeCalledTimes(0);
            await repo.update(submission);
            expect(mock.update).toBeCalledTimes(1);
            expect(mock.insert).toBeCalledTimes(0);
        });
        it('updates the updated time of the entry', async (): Promise<void> => {
            const submission = new Submission({
                id: entryId,
                status: SubmissionStatus.INITIAL,
                createdBy: '123',
                articleType: ArticleType.FEATURE_ARTICLE,
            });
            const lastUpdated = databaseEntries[0].updated;
            // https://jestjs.io/docs/en/mock-functions.html#mock-return-values
            adapter.executor = jest
                .fn()
                .mockReturnValueOnce([testDatabaseEntry])
                .mockReturnValueOnce(true);
            const repo = new XpubSubmissionRootRepository(adapter);
            const { updated } = await repo.update(submission);
            expect(updated).not.toEqual(lastUpdated);
        });
    });
    describe('create', () => {
        it('calls insert on knex', async (): Promise<void> => {
            const submission = new Submission({
                id: entryId,
                status: SubmissionStatus.INITIAL,
                createdBy: '123',
                articleType: ArticleType.FEATURE_ARTICLE,
            });
            adapter.executor = jest.fn();
            const repo = new XpubSubmissionRootRepository(adapter);
            repo.findById = jest.fn().mockReturnValue(null);
            expect(mock.insert).toBeCalledTimes(0);
            await repo.create(submission);
            expect(mock.insert).toBeCalledTimes(1);
            expect(mock.into).toBeCalledTimes(1);
            expect(mock.update).toBeCalledTimes(0);
        });
        it('returns a Submission when passed a Submission to create', async (): Promise<void> => {
            const submission = new Submission({
                id: entryId,
                status: SubmissionStatus.INITIAL,
                createdBy: '123',
                articleType: ArticleType.FEATURE_ARTICLE,
            });
            adapter.executor = jest.fn().mockReturnValue([]);
            const repo = new XpubSubmissionRootRepository(adapter);
            const result = await repo.create(submission);
            expect(result).toMatchObject({
                id: entryId,
                status: SubmissionStatus.INITIAL,
                createdBy: '123',
                articleType: ArticleType.FEATURE_ARTICLE,
            });
        });
    });
    describe('delete', () => {
        it('returns true when knex delete is successful', async () => {
            adapter.executor = jest.fn().mockReturnValue(true);
            const repo = new XpubSubmissionRootRepository(adapter);
            await expect(repo.delete(SubmissionId.fromUuid(uuid()))).resolves.toEqual(true);
        });
        it('returns false when knex delete is not successful', async () => {
            adapter.executor = jest.fn().mockReturnValue(false);
            const repo = new XpubSubmissionRootRepository(adapter);
            await expect(repo.delete(SubmissionId.fromUuid(uuid()))).resolves.toEqual(false);
        });
    });
});
