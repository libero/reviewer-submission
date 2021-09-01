import { SubmissionService } from './submission-service';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import Knex = require('knex');
import { v4 } from 'uuid';
import { SubmissionId, SubmissionStatus } from '../types';
import Submission, { ArticleType } from './models/submission';
import { S3Store } from './storage/s3-store';
import SES from 'aws-sdk/clients/ses';
import { MecaExporter } from './exporter/meca-exporter';
import { SftpStore } from './storage/sftp-store';
import { MailService } from '../../mail/services/mail-service';
import { FileId, FileType } from '../../file/types';
import { Auditor, AuditAction } from '../../audit/types';
import File from '../../file/services/models/file';
import { User } from '../../user/user';
import { FileService } from '../../file/services/file-service';

const flushPromises = (): Promise<void> => new Promise(setImmediate);

jest.mock('aws-sdk/clients/ses');
jest.mock('./storage/submission-store');
const mockUserId = v4();
const mockSES = ({
    sendEmail: jest.fn(),
} as unknown) as SES;

const submissionModels: Submission[] = [
    new Submission({
        id: SubmissionId.fromUuid('3647dbde-c192-4bcd-9ecd-9a5e52111863'),
        status: SubmissionStatus.INITIAL,
        createdBy: '123',
        articleType: ArticleType.FEATURE_ARTICLE,
        updated: new Date('2020-02-18T15:14:53.155Z').toISOString(),
        created: new Date('2020-02-18T15:14:53.155Z').toISOString(),
    }),
    new Submission({
        id: SubmissionId.fromUuid('e0ba60c9-1966-43bc-ba83-6a09c6f3ab1c'),
        status: SubmissionStatus.INITIAL,
        createdBy: '124',
        articleType: ArticleType.RESEARCH_ADVANCE,
        updated: new Date('2020-02-18T15:14:53.155Z').toISOString(),
        created: new Date('2020-02-18T15:14:53.155Z').toISOString(),
    }),
];
jest.mock('../repositories/xpub-submission-root');
let mailService = new MailService(mockSES, 'noreply@elifesciences.org', false);

jest.mock('./exporter/meca-exporter');
const makeSubmissionService = (
    mecaInjectable = jest.fn(),
    auditService = { recordAudit: jest.fn() },
    fileService = { deleteFilesForSubmission: jest.fn() },
): SubmissionService =>
    new SubmissionService(
        (null as unknown) as Knex,
        ({ export: mecaInjectable } as unknown) as MecaExporter,
        (jest.fn() as unknown) as S3Store,
        (jest.fn() as unknown) as SftpStore,
        mailService,
        (auditService as unknown) as Auditor,
        (fileService as unknown) as FileService,
    );

describe('Submission Service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mailService = new MailService(mockSES, 'noreply@elifesciences.org', false);
    });
    const authorData = {
        firstName: 'string',
        lastName: 'string',
        email: 'name@elifesciences.org',
        institution: 'institution',
    };
    const manuscriptData = {
        title: 'title',
        subjects: ['sub'],
        previouslyDiscussed: 'string',
        previouslySubmitted: 'string',
        cosubmission: ['co-sub'],
    };
    const filesData = {
        coverLetter: 'letter',
        manuscriptFile: new File({
            id: FileId.fromUuid('3647dbde-c192-4bcd-9ecd-9a5e52111863'),
            submissionId: SubmissionId.fromUuid('3647dbde-c192-4bcd-9ecd-9a5e52111863'),
            mimeType: 'mimeType',
            filename: 'filename',
            status: 'STORED',
            size: 0,
            type: FileType.MANUSCRIPT_SOURCE,
            created: new Date(),
            updated: new Date(),
        }),
    };
    const editorsData = {
        suggestedSeniorEditors: ['11'],
        opposedSeniorEditors: ['222'],
        opposedSeniorEditorsReason: 'string',
        suggestedReviewingEditors: ['222'],
        opposedReviewingEditors: ['222'],
        opposedReviewingEditorsReason: 'reason',
        suggestedReviewers: [
            {
                name: 'string',
                email: 's@elife.org',
            },
        ],
        opposedReviewers: [
            {
                name: 'string',
                email: 's@elife.org',
            },
        ],
        opposedReviewersReason: 'string',
    };
    const disclosureData = {
        submitterSignature: 'signature',
        disclosureConsent: true,
    };
    const suggestions = [
        {
            value: 'string',
            fieldName: 'string',
        },
    ];
    describe('submit', () => {
        it('should audit a successful MECA export submit', async (): Promise<void> => {
            const updateMock = jest.fn().mockReturnValue(true);
            XpubSubmissionRootRepository.prototype.update = updateMock;
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionModels[0]);
            MailService.prototype.sendEmail = jest.fn();
            const recordAuditMock = jest.fn();
            const auditServiceMock = { recordAudit: recordAuditMock };
            const service = makeSubmissionService(undefined, auditServiceMock);
            const submitable = submissionModels[0];
            submitable.lastStepVisited = '1';
            submitable.status = 'INITIAL';
            submitable.author = authorData;
            submitable.manuscriptDetails = manuscriptData;
            submitable.files = filesData;
            submitable.editorDetails = editorsData;
            submitable.disclosure = disclosureData;
            submitable.suggestions = suggestions;
            await service.submit(submitable, '1.1.1.1', mockUserId);
            await flushPromises();
            expect(recordAuditMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    action: AuditAction.UPDATED,
                    value: JSON.stringify({ status: 'MECA_EXPORT_PENDING' }),
                    objectType: 'submission',
                    objectId: submissionModels[0].id,
                }),
            );
            expect(recordAuditMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    action: AuditAction.UPDATED,
                    value: JSON.stringify({ status: 'MECA_EXPORT_SUCCEEDED' }),
                    objectType: 'submission',
                    objectId: submissionModels[0].id,
                }),
            );
        });
        it('should audit a failed MECA export submit', async (): Promise<void> => {
            const updateMock = jest.fn().mockReturnValue(true);
            XpubSubmissionRootRepository.prototype.update = updateMock;
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionModels[0]);
            MailService.prototype.sendEmail = jest.fn();
            const recordAuditMock = jest.fn();
            const auditServiceMock = { recordAudit: recordAuditMock };
            const service = makeSubmissionService(
                jest.fn(() => Promise.reject()),
                auditServiceMock,
            );
            const submitable = submissionModels[0];
            submitable.lastStepVisited = '1';
            submitable.status = 'INITIAL';
            submitable.author = authorData;
            submitable.manuscriptDetails = manuscriptData;
            submitable.files = filesData;
            submitable.editorDetails = editorsData;
            submitable.disclosure = disclosureData;
            submitable.suggestions = suggestions;
            await service.submit(submitable, '1.1.1.1', mockUserId);
            await flushPromises();
            expect(recordAuditMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    action: AuditAction.UPDATED,
                    value: JSON.stringify({ status: 'MECA_EXPORT_PENDING' }),
                    objectType: 'submission',
                    objectId: submissionModels[0].id,
                }),
            );
            expect(recordAuditMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    action: AuditAction.UPDATED,
                    value: JSON.stringify({ status: 'MECA_EXPORT_FAILED' }),
                    objectType: 'submission',
                    objectId: submissionModels[0].id,
                }),
            );
        });
        it('should call send email', async () => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionModels[0]);
            MailService.prototype.sendEmail = jest.fn();
            const service = makeSubmissionService();
            const submitable = submissionModels[0];
            submitable.lastStepVisited = '1';
            submitable.status = 'INITIAL';
            submitable.author = authorData;
            submitable.manuscriptDetails = manuscriptData;
            submitable.files = filesData;
            submitable.editorDetails = editorsData;
            submitable.disclosure = disclosureData;
            submitable.suggestions = suggestions;
            await service.submit(submitable, '1.1.1.1', mockUserId);
            expect(mailService.sendEmail).toHaveBeenCalledTimes(1);
        });

        it('should set the correct status on success', async () => {
            const updateMock = jest.fn().mockReturnValue(true);
            XpubSubmissionRootRepository.prototype.update = updateMock;
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionModels[0]);
            MailService.prototype.sendEmail = jest.fn();
            const service = makeSubmissionService();
            const submitable = submissionModels[0];
            submitable.lastStepVisited = '1';
            submitable.status = 'INITIAL';
            submitable.author = authorData;
            submitable.manuscriptDetails = manuscriptData;
            submitable.files = filesData;
            submitable.editorDetails = editorsData;
            submitable.disclosure = disclosureData;
            submitable.suggestions = suggestions;
            await service.submit(submitable, '1.1.1.1', mockUserId);
            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'MECA_EXPORT_SUCCEEDED',
                }),
            );
        });

        it('should set the correct status on failure', async () => {
            const updateMock = jest.fn().mockReturnValue(true);
            XpubSubmissionRootRepository.prototype.update = updateMock;
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionModels[0]);
            MailService.prototype.sendEmail = jest.fn();
            const service = makeSubmissionService(jest.fn(() => Promise.reject()));
            const submitable = submissionModels[0];
            submitable.lastStepVisited = '1';
            submitable.status = 'INITIAL';
            submitable.author = authorData;
            submitable.manuscriptDetails = manuscriptData;
            submitable.files = filesData;
            submitable.editorDetails = editorsData;
            submitable.disclosure = disclosureData;
            submitable.suggestions = suggestions;
            await service.submit(submitable, '1.1.1.1', mockUserId);
            expect(updateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'MECA_EXPORT_FAILED',
                }),
            );
        });
    });

    describe('resubmit', () => {
        it('should audit a successful MECA export submit', async (): Promise<void> => {
            const updateMock = jest.fn().mockReturnValue(true);
            XpubSubmissionRootRepository.prototype.update = updateMock;
            XpubSubmissionRootRepository.prototype.findById = jest.fn().mockReturnValue(submissionModels[0]);
            MailService.prototype.sendEmail = jest.fn();
            const recordAuditMock = jest.fn();
            const auditServiceMock = { recordAudit: recordAuditMock };
            const service = makeSubmissionService(undefined, auditServiceMock);
            const submitable = submissionModels[0];
            submitable.lastStepVisited = '1';
            submitable.status = 'INITIAL';
            submitable.author = authorData;
            submitable.manuscriptDetails = manuscriptData;
            submitable.files = filesData;
            submitable.editorDetails = editorsData;
            submitable.disclosure = disclosureData;
            submitable.suggestions = suggestions;
            await service.resubmit(submitable);
            await flushPromises();
            expect(recordAuditMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'SYSTEM',
                    action: AuditAction.UPDATED,
                    value: JSON.stringify({ status: 'MECA_EXPORT_SUCCEEDED', retry: true }),
                    objectType: 'submission',
                    objectId: submissionModels[0].id,
                }),
            );
        });
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
        it('audits create submission action', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (submission: Submission) => submission);
            const recordAuditMock = jest.fn();
            const auditServiceMock = { recordAudit: recordAuditMock };
            const service = makeSubmissionService(undefined, auditServiceMock);
            const submission = await service.create('research-article', mockUserId);
            expect(recordAuditMock).toBeCalledTimes(1);
            expect(recordAuditMock).toBeCalledWith(
                expect.objectContaining({
                    userId: mockUserId,
                    action: AuditAction.CREATED,
                    value: JSON.stringify({ articleType: 'research-article' }),
                    objectType: 'submission',
                    objectId: submission.id,
                }),
            );
        });
        it('throws if an invalid articleType is passed', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (submission: Submission) => submission);
            const service = makeSubmissionService();
            await expect(service.create('articleType', mockUserId)).rejects.toThrow('Invalid article type');
        });
        it('returns a created Submission when correct values are sent', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (submission: Submission) => submission);
            const service = makeSubmissionService();
            const submission = await service.create('research-article', mockUserId);
            expect(submission).toBeInstanceOf(Submission);
        });
        it('returns a created Submission with correctly set initial properties', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.create = jest.fn(async (submission: Submission) => submission);
            const service = makeSubmissionService();
            const submission = await service.create('research-article', mockUserId);
            expect(submission.status).toBe('INITIAL');
            expect(submission.articleType).toBe('research-article');
            expect(submission.createdBy).toBe(mockUserId);
            expect(submission.id).toBeDefined();
            expect(submission.updated).toBeDefined();
            expect(submission.lastStepVisited).toBe(`/submit/${submission.id}/author`);
        });
    });

    describe('deleteSubmission', () => {
        it('should return true if is deletes the submission', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.delete = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await expect(service.delete({} as User, submissionModels[0].id)).resolves.toBe(true);
        });
        it('should return false if deletion fails', async (): Promise<void> => {
            XpubSubmissionRootRepository.prototype.delete = jest.fn().mockReturnValue(false);
            const service = makeSubmissionService();
            await expect(service.delete({} as User, submissionModels[0].id)).resolves.toBe(false);
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
    describe('setStatus', () => {
        it('sets the status passed', async () => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.updateStatus(submissionModels[0], SubmissionStatus.MECA_EXPORT_FAILED);

            const expected = {
                status: 'MECA_EXPORT_FAILED',
            };

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });
    });

    describe('saveArticleType', () => {
        it('updates the submissions articleType', async () => {
            XpubSubmissionRootRepository.prototype.update = jest.fn().mockReturnValue(true);
            const service = makeSubmissionService();
            await service.saveArticleType(submissionModels[0], ArticleType.RESEARCH_ARTICLE);

            const expected = {
                ...submissionModels[0],
                articleType: 'research-article',
            };

            await expect(XpubSubmissionRootRepository.prototype.update).toBeCalledWith(
                expect.objectContaining(expected),
            );
        });
    });
});
