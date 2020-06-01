import { SubmissionService } from './submission-service';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 } from 'uuid';
import Knex = require('knex');
import { SubmissionId } from '../types';
import Submission, { SubmissionStatus, ArticleType } from './models/submission';
import { FileService } from 'src/domain/file/services/file-service';
import { S3Store } from './storage/s3-store';
import { MecaExporter } from './exporter/meca-exporter';
import { SftpStore } from './storage/sftp-store';

const submissionModels: Submission[] = [
    new Submission({
        id: SubmissionId.fromUuid(v4()),
        status: SubmissionStatus.INITIAL,
        createdBy: '123',
        articleType: ArticleType.FEATURE_ARTICLE,
        updated: new Date('2020-02-18T15:14:53.155Z'),
    }),
    new Submission({
        id: SubmissionId.fromUuid(v4()),
        status: SubmissionStatus.INITIAL,
        createdBy: '124',
        articleType: ArticleType.RESEARCH_ADVANCE,
        updated: new Date('2020-02-18T15:14:53.155Z'),
    }),
];
jest.mock('../repositories/xpub-submission-root');

const makeSubmissionService = (): SubmissionService =>
    new SubmissionService(
        (null as unknown) as Knex,
        (jest.fn() as unknown) as MecaExporter,
        (jest.fn() as unknown) as S3Store,
        (jest.fn() as unknown) as SftpStore,
    );

describe('Submission Service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('findAll', () => {
        it('should return results as array of Submissions - findAll', async () => {
            XpubSubmissionRootRepository.prototype.findAll = jest.fn().mockReturnValue(submissionModels);
            const service = makeSubmissionService();
            const results = await service.findAll();
            expect(results).toHaveLength(2);
            expect(results[0]).toBeInstanceOf(Submission);
        });

        it('should return empty array and not throw if results are empty', async () => {
            XpubSubmissionRootRepository.prototype.findAll = jest.fn().mockReturnValue([]);
            const service = makeSubmissionService();
            const results = await service.findAll();
            expect(results).toHaveLength(0);
        });
    });

    describe('findSubmission', () => {
        it('should return a Submission if one exists', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionModels[0]);
            const service = makeSubmissionService();
            const submission = await service.get(submissionModels[0].id);
            expect(submission).toBeInstanceOf(Submission);
        });
        it('throws an error when no submission found', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(null);
            const service = makeSubmissionService();
            await expect(service.get(submissionModels[0].id)).rejects.toThrow(
                'Unable to find submission with id: ' + submissionModels[0].id,
            );
        });
    });

    describe('create', () => {
        it('throws if an invalid articleType is passed', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (submission: Submission) => submission);
            const service = makeSubmissionService();
            await expect(service.create('articleType', 'userId')).rejects.toThrow();
        });
        it('returns a created Submission when correct values are sent', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (submission: Submission) => submission);
            const service = makeSubmissionService();
            const submission = await service.create('research-article', 'userId');
            expect(submission).toBeInstanceOf(Submission);
        });
        it('returns a created Submission with correctly set initial properties', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (submission: Submission) => submission);
            const service = makeSubmissionService();
            const submission = await service.create('research-article', 'userId');
            expect(submission.status).toBe('INITIAL');
            expect(submission.articleType).toBe('research-article');
            expect(submission.createdBy).toBe('userId');
            expect(submission.id).toBeDefined();
            expect(submission.updated).toBeDefined();
        });
    });

    describe('deleteSubmission', () => {
        it('should return true if is deletes the submission', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.delete = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await expect(service.delete(submissionModels[0].id)).resolves.toBe(true);
        });
        it('should return false if deletion fails', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.delete = jest.fn().mockReturnValue(false);
            const service = makeSubmissionService();
            await expect(service.delete(submissionModels[0].id)).resolves.toBe(false);
        });
    });
});
