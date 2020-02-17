import { SubmissionService } from './submission-service';
import { MockKnex } from '../../test-mocks/knex-mock';
import Knex = require('knex');
import uuid = require('uuid');
import { SubmissionId, xpubMeta } from '../submission';
import { Author } from '../people';

describe('Submission Service', () => {
    let mockKnex: MockKnex;

    const meta: xpubMeta = {
        articleType: 'type',
        title: 'title',
    };

    const dtoSubmission = {
        id: SubmissionId.fromUuid(uuid()),
        title: 'The title',
        status: 'INITIAL',
        updated: new Date(),
        meta,
    };

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

    it('should return results as array - findAll', async () => {
        mockKnex.from = jest.fn().mockImplementation(() => [dtoSubmission, dtoSubmission]);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const results = await service.findAll();
        expect(results).toHaveLength(2);
    });

    it('should return empty array and not throw if results are empty - findAll', async () => {
        mockKnex.from = jest.fn().mockImplementation(() => []);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const results = await service.findAll();
        expect(results).toHaveLength(0);
    });

    it('should call repo findById and return null if empty - findOne', async () => {
        mockKnex.where = jest.fn().mockImplementation(() => []);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const results = await service.findOne(SubmissionId.fromUuid(uuid()));
        expect(results).toBe(null);
    });

    it('should return matching object if found - findOne', async () => {
        mockKnex.where = jest.fn().mockImplementation(() => [dtoSubmission]);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const submission = await service.findOne(dtoSubmission.id);
        const expectedId = submission ? submission.id : null;
        expect(expectedId).toBeTruthy();
        expect(expectedId).toBe(dtoSubmission.id);
    });

    it('should throw if invalid article type - create', async () => {
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        expect(service.create('articleType', 'userId')).rejects.toThrowError();
    });

    it('should return new submission if valid - create', async () => {
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const submission = await service.create('researchArticle', 'userId');
        const submissionId = submission == null ? null : submission.id;
        expect(submissionId).toBeTruthy();
        expect(submissionId).toHaveLength(36);
    });

    it('should change title - changeTitle', async () => {
        const title = 'i am updated';
        mockKnex.where = jest.fn().mockImplementation(() => [dtoSubmission]);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const submission = await service.changeTitle(dtoSubmission.id, title);
        const submissionId = submission == null ? null : submission.id;
        const returnedTitle = submission == null ? null : submission.title;
        expect(submissionId).toBeTruthy();
        expect(submissionId).toHaveLength(36);
        expect(returnedTitle).toBe(title);
    });

    it('should throw if submission is not found - changeTitle', async () => {
        const title = 'i am updated';
        mockKnex.where = jest.fn().mockImplementation(() => []);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        expect(service.changeTitle(dtoSubmission.id, title)).rejects.toThrowError();
    });

    it('should return true is delete is successful - delete', async () => {
        mockKnex.delete = jest.fn().mockImplementation(() => 1);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const deleteOutcome = await service.delete(dtoSubmission.id);
        expect(deleteOutcome).toBe(true);
    });

    it('should return false is delete is unsuccessful - delete', async () => {
        mockKnex.delete = jest.fn().mockImplementation(() => 0);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const deleteOutcome = await service.delete(dtoSubmission.id);
        expect(deleteOutcome).toBe(false);
    });

    it('should return false if article type is not supported - validateArticleType', async () => {
        const isSupported = SubmissionService.validateArticleType('not real');
        expect(isSupported).toBe(false);
    });

    it('should return true if article type is supported - validateArticleType', async () => {
        const isSupported = SubmissionService.validateArticleType('researchArticle');
        expect(isSupported).toBe(true);
    });

    it('it should update and return autosaved submission - autoSave', async () => {
        const id = SubmissionId.fromUuid(uuid());
        const dbSubmission = {
            id,
            title: 'The title',
            status: 'INITIAL',
            createdBy: '123',
            updated: new Date(),
            articleType: 'newspaper',
            meta,
        };
        const details: Author = {
            firstName: 'a',
            lastName: 'b',
            email: 'a@b.com',
            institution: 'c',
        };
        mockKnex.where = jest.fn().mockImplementation(() => [dbSubmission]);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const submission = await service.saveDetailsPage(id, details);
        expect(submission.details).toBe(details);
    });

    it('it should throw is submission is not found', async () => {
        const id = SubmissionId.fromUuid(uuid());
        const details: Author = {
            firstName: 'a',
            lastName: 'b',
            email: 'a@b.com',
            institution: 'c',
        };
        mockKnex.where = jest.fn().mockImplementation(() => []);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        expect(service.saveDetailsPage(id, details)).rejects.toThrowError();
    });
});
