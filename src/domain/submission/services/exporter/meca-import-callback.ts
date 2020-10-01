import { v4 as uuid } from 'uuid';
import { SubmissionService } from '../submission-service';
import { InfraLogger as logger } from '../../../../logger';
import { SubmissionStatus } from '../../types';
import { SubmissionId } from '../../types';
import { AuditService } from '../../../audit/services/audit';
import { AuditAction, AuditId, ObjectId } from '../../../audit/types';
import { MailService } from '../../../mail/services/mail-service';

export class MecaImportCallback {
    constructor(
        private readonly submissionService: SubmissionService,
        private readonly auditService: AuditService,
        private readonly mailService: MailService,
        private readonly mecaEmailSubjectPrefix: string,
        private readonly mecaEmailRecipient: string,
    ) {}

    validateResponse(response: string): boolean {
        return response === 'success' || response === 'failure';
    }
    async storeResult(id: string, body: { result: string }): Promise<void> {
        const submissionId = SubmissionId.fromUuid(id);
        const { result } = body;
        const status =
            result === 'success' ? SubmissionStatus.MECA_IMPORT_SUCCEEDED : SubmissionStatus.MECA_IMPORT_FAILED;
        try {
            await this.auditService.recordAudit({
                id: AuditId.fromUuid(uuid()),
                userId: 'SYSTEM',
                action: AuditAction.MECA_RESULT,
                value: JSON.stringify(body),
                objectType: 'submission',
                objectId: ObjectId.fromUuid(id),
                created: new Date(),
                updated: new Date(),
            });
        } catch (error) {
            logger.error(`error saving audit log ${error}`);
        }
        logger.info('MECA callback received', { id, result });
        const submission = await this.submissionService.get(submissionId);
        try {
            await this.submissionService.updateStatus(submission, status);
            if (status === SubmissionStatus.MECA_IMPORT_FAILED) {
                const mailText = `
                  EJP failed to import MECA package.
                  Manuscript ID: ${id}
                  EJP response: ${result}
                `;
                await this.mailService.sendEmail(
                    mailText,
                    mailText,
                    `${this.mecaEmailSubjectPrefix} MECA import failed`,
                    [this.mecaEmailRecipient],
                );
            }
        } catch (e) {
            throw new Error('Unable to update manuscript ' + id);
        }
    }
}
