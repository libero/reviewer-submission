import { SubmissionService } from '../submission-service';
import { InfraLogger as logger } from '../../../../logger';
import { SubmissionStatus } from '../../types';
import { SubmissionId } from '../../types';
import { AuditService } from '../../../audit/services/audit';
import { AuditAction, AuditId, UserId, ObjectId } from '../../../audit/types';
import { v4 as uuid } from 'uuid';

export class MecaImportCallback {
    constructor(private readonly submissionService: SubmissionService, private readonly auditService: AuditService) {}

    validateResponse(response: string): boolean {
        return response === 'success' || response === 'failure';
    }
    async storeResult(id: string, response: string): Promise<void> {
        const submissionId = SubmissionId.fromUuid(id);
        const status =
            response === 'success' ? SubmissionStatus.MECA_IMPORT_SUCCEEDED : SubmissionStatus.MECA_IMPORT_FAILED;
        try {
            await this.auditService.recordAudit({
                id: AuditId.fromUuid(uuid()),
                userId: UserId.fromUuid('SYSTEM'),
                action: AuditAction.UPDATED,
                value: status,
                objectType: 'submission.status',
                objectId: ObjectId.fromUuid(id),
                created: new Date(),
                updated: new Date(),
            });
        } catch (error) {
            logger.error(`error saving audit log ${error}`);
        }
        logger.info('MECA callback received', { id, response });
        const submission = await this.submissionService.get(submissionId);
        try {
            await this.submissionService.updateStatus(submission, status);
        } catch (e) {
            throw new Error('Unable to update manuscript ' + id);
        }

        //send email
    }
}
