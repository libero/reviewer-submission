import { SubmissionService } from './submission-service';
import { MockKnex } from '../../test-mocks/knex-mock';
import Knex = require('knex');
import uuid = require('uuid');
import { SubmissionId, xpubMeta } from '../submission';

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

    it('should call repo findAll and return results', async () => {
        mockKnex.from = jest.fn().mockImplementation(() => [dtoSubmission, dtoSubmission]);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const results = await service.findAll();
        expect(results).toHaveLength(2);
    });

    it('should call repo findAll and not throw if results are empty', async () => {
        mockKnex.from = jest.fn().mockImplementation(() => []);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const results = await service.findAll();
        expect(results).toHaveLength(0);
    });

    it('should call repo findById and return null if empty', async () => {
        mockKnex.where = jest.fn().mockImplementation(() => []);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const results = await service.findOne(SubmissionId.fromUuid(uuid()));
        expect(results).toBe(null);
    });

    it('should call repo findById and return matching object if not empty', async () => {
        mockKnex.where = jest.fn().mockImplementation(() => [dtoSubmission]);
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const submission = await service.findOne(dtoSubmission.id);
        const expectedId = submission ? submission.id : null;
        expect(expectedId).toBeTruthy();
        expect(expectedId).toBe(dtoSubmission.id);
    });

    it('should throw if invalid article type', async () => {
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        expect(service.create('articleType', 'userId')).rejects.toThrowError();
    });

    it('should return new submission', async () => {
        const service = new SubmissionService((mockKnex as unknown) as Knex);
        const submission = await service.create('researchArticle', 'userId');
        const submissionId = submission == null ? null : submission.id;
        expect(submissionId).toBeTruthy();
        expect(submissionId).toHaveLength(36);
    });
});
