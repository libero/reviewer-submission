import { SubmissionService } from './submission-service';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import Knex = require('knex');
import { SubmissionId, SubmissionStatus } from '../types';
import Submission, { ArticleType } from './models/submission';
import { S3Store } from './storage/s3-store';
import { MecaExporter } from './exporter/meca-exporter';
import { SftpStore } from './storage/sftp-store';

const submissionModels: Submission[] = [
    new Submission({
        id: SubmissionId.fromUuid('3647dbde-c192-4bcd-9ecd-9a5e52111863'),
        status: SubmissionStatus.INITIAL,
        createdBy: '123',
        articleType: ArticleType.FEATURE_ARTICLE,
        updated: new Date('2020-02-18T15:14:53.155Z'),
    }),
    new Submission({
        id: SubmissionId.fromUuid('e0ba60c9-1966-43bc-ba83-6a09c6f3ab1c'),
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
            await expect(service.create('articleType', 'userId')).rejects.toThrow('Invalid article type');
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
            expect(submission.lastStepVisited).toBe(`/submit/${submission.id}/author`);
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

    describe('saveAuthorDetails', () => {
        it('should update author', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveAuthorDetails(submissionModels[0]);

            const expected = {
                ...submissionModels[0],
            };

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });

        it('should set lastStepVisited', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveAuthorDetails(submissionModels[0]);

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining({
                    lastStepVisited: '/submit/3647dbde-c192-4bcd-9ecd-9a5e52111863/author',
                }),
            );
        });
    });

    describe('saveFilesDetails', () => {
        it('should update file details', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveFilesDetails(submissionModels[0], 'letter');

            const expected = {
                ...submissionModels[0],
            };

            expected.files.coverLetter = 'letter';

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });
        it('should set lastStepVisited', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveFilesDetails(submissionModels[0], 'letter');
            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining({
                    lastStepVisited: '/submit/3647dbde-c192-4bcd-9ecd-9a5e52111863/files',
                }),
            );
        });
    });
    describe('saveManuscriptDetails', () => {
        it('should update manuscript details', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            const details = {
                title: 'title',
                subjects: ['s1', 's2'],
                previouslyDiscussed: 'discussed',
                previouslySubmitted: 'submitted',
                cosubmission: ['1234', '2345'],
            };

            await service.saveManuscriptDetails(submissionModels[0], details);

            const expected = {
                ...submissionModels[0],
            };
            expected.manuscriptDetails = details;

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });
        it('should set lastStepVisited', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveManuscriptDetails(submissionModels[0], {});
            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining({
                    ...submissionModels[0],
                    lastStepVisited: '/submit/3647dbde-c192-4bcd-9ecd-9a5e52111863/details',
                }),
            );
        });
    });
    describe('saveEditorDetails', () => {
        it('should update editor details', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveEditorDetails(submissionModels[0], 'r1', 'r2', 'r3');

            const expected = {
                ...submissionModels[0],
            };

            expected.editorDetails.opposedReviewersReason = 'r1';
            expected.editorDetails.opposedReviewingEditorsReason = 'r2';
            expected.editorDetails.opposedSeniorEditorsReason = 'r3';

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });
        it('should set lastStepVisited', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveEditorDetails(submissionModels[0], 'r1', 'r2', 'r3');

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining({
                    lastStepVisited: '/submit/3647dbde-c192-4bcd-9ecd-9a5e52111863/editors',
                }),
            );
        });
    });
    describe('saveDisclosureDetails', () => {
        it('should update disclousure details', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            const disclosure = {
                submitterSignature: 'squiggle',
                disclosureConsent: true,
            };
            await service.saveDisclosureDetails(submissionModels[0], disclosure);

            const expected = {
                ...submissionModels[0],
            };

            expected.disclosure = disclosure;

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });
        it('should set lastStepVisited', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveDisclosureDetails(submissionModels[0], {
                submitterSignature: '',
                disclosureConsent: true,
            });

            const expected = {
                lastStepVisited: '/submit/3647dbde-c192-4bcd-9ecd-9a5e52111863/disclosure',
            };

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });
    });
});
