import { SubmissionService } from './submission-service';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 } from 'uuid';
import Knex = require('knex');
import { SubmissionId } from '../types';
import { SubmissionDTO } from '../repositories/types';
import Submission from './models/submission';

const submissionRootDTOs: SubmissionDTO[] = [
    {
        id: SubmissionId.fromUuid(v4()),
        title: 'The title',
        status: 'INITIAL',
        createdBy: '123',
        articleType: 'researchArticle',
        updated: new Date('2020-02-18T15:14:53.155Z'),
    },
    {
        id: SubmissionId.fromUuid(v4()),
        title: 'Another title',
        status: 'INITIAL',
        createdBy: '124',
        articleType: 'researchAdvance',
        updated: new Date('2020-02-18T15:14:53.155Z'),
    },
];

jest.mock('../repositories/xpub-submission-root');

describe('Submission Service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('findAll', () => {
        it('should return results as array of Submissions - findAll', async () => {
            XpubSubmissionRootRepository.prototype.findAll = jest.fn().mockReturnValue(submissionRootDTOs);
            const service = new SubmissionService((null as unknown) as Knex);
            const results = await service.findAll();
            expect(results).toHaveLength(2);
            expect(results[0]).toBeInstanceOf(Submission);
        });

        it('should return empty array and not throw if results are empty', async () => {
            XpubSubmissionRootRepository.prototype.findAll = jest.fn().mockReturnValue([]);
            const service = new SubmissionService((null as unknown) as Knex);
            const results = await service.findAll();
            expect(results).toHaveLength(0);
        });
    });

    describe('findSubmission', () => {
        it('should return a Submission if one exists', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionRootDTOs[0]);
            const service = new SubmissionService((null as unknown) as Knex);
            const submission = await service.get(submissionRootDTOs[0].id);
            expect(submission).toBeInstanceOf(Submission);
        });
        it('throws an error when no submission foubnd', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(null);
            const service = new SubmissionService((null as unknown) as Knex);
            await expect(service.get(submissionRootDTOs[0].id)).rejects.toThrow(
                'Unable to find submission with id: ' + submissionRootDTOs[0].id,
            );
        });
    });

    describe('create', () => {
        it('throws if an invalid articleType is passed', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (dto: SubmissionDTO) => dto);
            const service = new SubmissionService((null as unknown) as Knex);
            await expect(service.create('articleType', 'userId')).rejects.toThrow();
        });
        it('returns a created Submission when correct values are sent', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (dto: SubmissionDTO) => dto);
            const service = new SubmissionService((null as unknown) as Knex);
            const submission = await service.create('researchArticle', 'userId');
            expect(submission).toBeInstanceOf(Submission);
        });
        it('returns a created Submission with correctly set initial properties', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (dto: SubmissionDTO) => dto);
            const service = new SubmissionService((null as unknown) as Knex);
            const submission = await service.create('researchArticle', 'userId');
            expect(submission.status).toBe('INITIAL');
            expect(submission.articleType).toBe('researchArticle');
            expect(submission.createdBy).toBe('userId');
            expect(submission.id).toBeDefined();
            expect(submission.updated).toBeDefined();
        });
    });

    describe('deleteSubmission', () => {
        it('should return true if is deletes the submission', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.delete = jest.fn().mockReturnValue(true);
            const service = new SubmissionService((null as unknown) as Knex);
            await expect(service.delete(submissionRootDTOs[0].id)).resolves.toBe(true);
        });
        it('should return false if deletion fails', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.delete = jest.fn().mockReturnValue(false);
            const service = new SubmissionService((null as unknown) as Knex);
            await expect(service.delete(submissionRootDTOs[0].id)).resolves.toBe(false);
        });
    });
});
