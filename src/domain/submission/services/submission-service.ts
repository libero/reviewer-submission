import * as Knex from 'knex';
import { SubmissionId, ManuscriptDetails, DisclosureDetails, SubmissionStatus } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 as uuid } from 'uuid';
import Submission, { ArticleType } from './models/submission';
import { createKnexAdapter } from '../../knex-table-adapter';
import { MecaExporter } from './exporter/meca-exporter';
import { S3Store } from './storage/s3-store';
import { SftpStore } from './storage/sftp-store';
import { SubmissionStore } from './storage/submission-store';
import { InfraLogger as logger } from '../../../logger';
import { Auditor, AuditId, ObjectId, UserId, AuditAction } from '../../audit/types';
import { MailService } from '../../mail/services/mail-service';
import { submittedEmail } from './emails';
import { FileService } from '../../file/services/file-service';
import { User } from '../../user/user';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;
    constructor(
        knex: Knex<{}, unknown[]>,
        private readonly mecaExporter: MecaExporter,
        private readonly s3Store: S3Store,
        private readonly sftpStore: SftpStore,
        private readonly mailService: MailService,
        private readonly auditService: Auditor,
        private readonly fileService: FileService,
    ) {
        const adapter = createKnexAdapter(knex, 'public');
        this.submissionRepository = new XpubSubmissionRootRepository(adapter);
    }
    private setLastStepVisited(submission: Submission, step: string): void {
        submission.lastStepVisited = `/submit/${submission.id}/${step}`;
    }
    private async runMecaExport(submission: Submission, ip: string): Promise<void> {
        const buffer = await this.mecaExporter.export(submission, ip);
        const id = submission.id;
        const store = new SubmissionStore([this.s3Store, this.sftpStore]);
        const locations = await store.write(id, buffer);
        logger.info(`Submission ${id} saved to ${JSON.stringify(locations, null, 4)}`);
    }
    async findAll(): Promise<Submission[]> {
        return await this.submissionRepository.findAll();
    }
    async findByUserId(userId: string): Promise<Submission[]> {
        return await this.submissionRepository.findByUserId(userId);
    }
    async create(articleType: string, userId: string): Promise<Submission> {
        const id = SubmissionId.fromUuid(uuid());
        const submission = new Submission({
            id,
            updated: new Date().toISOString(),
            articleType,
            status: SubmissionStatus.INITIAL,
            createdBy: userId,
        });
        this.setLastStepVisited(submission, 'author');
        const createdSubmission = await this.submissionRepository.create(submission);
        await this.auditService.recordAudit({
            id: AuditId.fromUuid(uuid()),
            userId: UserId.fromUuid(userId),
            action: AuditAction.CREATED,
            value: JSON.stringify({ articleType }),
            objectType: 'submission',
            objectId: ObjectId.fromUuid(submission.id.toString()),
            created: new Date(),
            updated: new Date(),
        });
        return createdSubmission;
    }
    async get(id: SubmissionId): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        return submission;
    }
    async delete(user: User, id: SubmissionId): Promise<boolean> {
        await this.fileService.deleteFilesForSubmission(user, id);
        return await this.submissionRepository.delete(id);
    }
    async submit(submission: Submission, ip: string, userId: string): Promise<Submission> {
        const id = submission.id;
        if (!submission.isSubmittable()) {
            throw new Error(`The submission ${id} cannot be submitted.`);
        }
        submission.status = SubmissionStatus.MECA_EXPORT_PENDING;
        await this.submissionRepository.update(submission);
        await this.auditService.recordAudit({
            id: AuditId.fromUuid(uuid()),
            userId: UserId.fromUuid(userId),
            action: AuditAction.UPDATED,
            value: JSON.stringify({ status: SubmissionStatus.MECA_EXPORT_PENDING }),
            objectType: 'submission',
            objectId: ObjectId.fromUuid(submission.id.toString()),
            created: new Date(),
            updated: new Date(),
        });
        const toEmail = submission.author?.email;
        const emailContent = submittedEmail(submission.author?.firstName, submission.manuscriptDetails.title);
        const data = {
            html: emailContent.html,
            text: emailContent.text,
        };
        await this.mailService.sendEmail(data.text, data.html, 'Your eLife submission', [toEmail || '']);
        this.runMecaExport(submission, ip)
            .then(() => {
                submission.status = SubmissionStatus.MECA_EXPORT_SUCCEEDED;
            })
            .catch(e => {
                submission.status = SubmissionStatus.MECA_EXPORT_FAILED;
                logger.error(`Submission ${id} failed to export`, e);
            })
            .finally(async () => {
                await this.submissionRepository.update(submission);
                await this.auditService.recordAudit({
                    id: AuditId.fromUuid(uuid()),
                    userId: UserId.fromUuid(userId),
                    action: AuditAction.UPDATED,
                    value: JSON.stringify({ status: submission.status }),
                    objectType: 'submission',
                    objectId: ObjectId.fromUuid(submission.id.toString()),
                    created: new Date(),
                    updated: new Date(),
                });
            });
        return this.get(id);
    }

    async resubmit(submission: Submission): Promise<void> {
        try {
            await this.runMecaExport(submission, '0.0.0.0');
            submission.status = SubmissionStatus.MECA_EXPORT_SUCCEEDED;
            await this.auditService.recordAudit({
                id: AuditId.fromUuid(uuid()),
                userId: 'SYSTEM',
                action: AuditAction.UPDATED,
                value: JSON.stringify({ status: submission.status, retry: true }),
                objectType: 'submission',
                objectId: ObjectId.fromUuid(submission.id.toString()),
                created: new Date(),
                updated: new Date(),
            });
            await this.submissionRepository.update(submission);
        } catch (e) {
            logger.error('Unable to resubmit', e);
            await this.auditService.recordAudit({
                id: AuditId.fromUuid(uuid()),
                userId: 'SYSTEM',
                action: AuditAction.UPDATED,
                value: JSON.stringify({ status: submission.status, retry: true }),
                objectType: 'submission',
                objectId: ObjectId.fromUuid(submission.id.toString()),
                created: new Date(),
                updated: new Date(),
            });
            await this.submissionRepository.update(submission);
            throw new Error(e);
        }
    }

    async saveArticleType(submission: Submission, articleType: ArticleType): Promise<Submission> {
        submission.articleType = articleType;
        return await this.submissionRepository.update(submission);
    }

    async saveAuthorDetails(submission: Submission): Promise<Submission> {
        this.setLastStepVisited(submission, 'author');
        return await this.submissionRepository.update(submission);
    }
    async saveFilesDetails(submission: Submission, coverLetter: string): Promise<Submission> {
        submission.files.coverLetter = coverLetter;
        this.setLastStepVisited(submission, 'files');
        return await this.submissionRepository.update(submission);
    }
    async saveManuscriptDetails(submission: Submission, details: ManuscriptDetails): Promise<Submission> {
        submission.manuscriptDetails = details;
        this.setLastStepVisited(submission, 'details');
        return await this.submissionRepository.update(submission);
    }
    async saveEditorDetails(
        submission: Submission,
        opposedReviewersReason?: string,
        opposedReviewingEditorsReason?: string,
        opposedSeniorEditorsReason?: string,
    ): Promise<Submission> {
        submission.addOppositionReasons(
            opposedReviewersReason,
            opposedReviewingEditorsReason,
            opposedSeniorEditorsReason,
        );
        this.setLastStepVisited(submission, 'editors');
        return await this.submissionRepository.update(submission);
    }
    async saveDisclosureDetails(submission: Submission, disclosureDetails: DisclosureDetails): Promise<Submission> {
        submission.disclosure.submitterSignature = disclosureDetails.submitterSignature;
        submission.disclosure.disclosureConsent = disclosureDetails.disclosureConsent;
        this.setLastStepVisited(submission, 'disclosure');
        return await this.submissionRepository.update(submission);
    }

    async updateStatus(submission: Submission, status: SubmissionStatus): Promise<Submission> {
        submission.status = SubmissionStatus[status];
        return await this.submissionRepository.update(submission);
    }
}
