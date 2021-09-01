import { MecaImportCallback } from './meca-import-callback';
//import submission from './file-generators/article.test.data';
import { SubmissionService } from '../..';
import { AuditService } from 'src/domain/audit/services/audit';
import { MailService } from 'src/domain/mail/services/mail-service';
import { v4 } from 'uuid';
import { InfraLogger as logger } from '../../../../logger';

jest.mock('../../../../logger');

describe('MecaImportCallback', () => {
    describe('validateResponse', () => {
        it('should return true when success or failure is passed', () => {
            const mecaImportCallback = new MecaImportCallback(
                (jest.fn() as unknown) as SubmissionService,
                (jest.fn() as unknown) as AuditService,
                (jest.fn() as unknown) as MailService,
                '',
                '',
            );
            expect(mecaImportCallback.validateResponse('success')).toBeTruthy();
            expect(mecaImportCallback.validateResponse('failure')).toBeTruthy();
        });

        it('should return false for any other input', () => {
            const mecaImportCallback = new MecaImportCallback(
                (jest.fn() as unknown) as SubmissionService,
                (jest.fn() as unknown) as AuditService,
                (jest.fn() as unknown) as MailService,
                '',
                '',
            );
            expect(mecaImportCallback.validateResponse('blah')).toBeFalsy();
            expect(mecaImportCallback.validateResponse('')).toBeFalsy();
            expect(mecaImportCallback.validateResponse('true')).toBeFalsy();
            expect(mecaImportCallback.validateResponse('1')).toBeFalsy();
        });
    });

    describe('storeResult', () => {
        beforeEach(jest.resetAllMocks);

        const submissionGetMock = jest.fn();
        const submissionUpdateStatusMock = jest.fn();
        const submissionService = { get: submissionGetMock, updateStatus: submissionUpdateStatusMock };

        const recordAuditMock = jest.fn();
        const auditService = { recordAudit: recordAuditMock };

        const sendMailMock = jest.fn();
        const mailService = { sendEmail: sendMailMock };

        const createCallback = (prefix = 'prefix', recipient = 'recipient'): MecaImportCallback => {
            return new MecaImportCallback(
                (submissionService as unknown) as SubmissionService,
                (auditService as unknown) as AuditService,
                (mailService as unknown) as MailService,
                prefix,
                recipient,
            );
        };

        it('should audit the correct information', async () => {
            const mecaImportCallback = createCallback();
            const id = v4();
            await mecaImportCallback.storeResult(id, { result: 'success' });
            expect(recordAuditMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: id,
                    value: '{"result":"success"}',
                    objectType: 'submission',
                }),
            );
            expect(logger.error).not.toHaveBeenCalled();
        });

        it('should log an error if the audit fails', async () => {
            recordAuditMock.mockRejectedValue('out of cheese error');
            const mecaImportCallback = createCallback();
            const id = v4();
            await mecaImportCallback.storeResult(id, { result: 'success' });
            expect(recordAuditMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: id,
                    value: '{"result":"success"}',
                    objectType: 'submission',
                }),
            );
            expect(logger.error).toHaveBeenCalledWith(`error saving audit log out of cheese error`);
        });

        it('should call update when a submission is found', async () => {
            const id = v4();
            const submission = { id, status: 'initial' };
            submissionGetMock.mockResolvedValue(submission);
            const mecaImportCallback = createCallback();
            await mecaImportCallback.storeResult(id, { result: 'success' });
            expect(submissionUpdateStatusMock).toHaveBeenCalledWith(submission, 'MECA_IMPORT_SUCCEEDED');
        });

        it('should send an email when response is failed', async () => {
            const id = v4();
            const submission = { id, status: 'initial' };
            submissionGetMock.mockResolvedValue(submission);
            const mecaImportCallback = createCallback();
            await mecaImportCallback.storeResult(id, { result: 'failure' });
            expect(sendMailMock).toHaveBeenCalled();
        });

        it('should throw an error if unable to update the submission', async () => {
            const id = v4();
            const submission = { id, status: 'initial' };
            submissionGetMock.mockResolvedValue(submission);
            submissionUpdateStatusMock.mockRejectedValue('failed');
            const mecaImportCallback = createCallback();
            expect.assertions(1);
            try {
                await mecaImportCallback.storeResult(id, { result: 'success' });
            } catch (e) {
                expect(e.message).toEqual('Unable to update manuscript ' + id);
            }
        });
    });
});
