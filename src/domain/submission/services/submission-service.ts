import * as Knex from 'knex';
import { SubmissionId, ManuscriptDetails, DisclosureDetails, SubmissionStatus } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 as uuid } from 'uuid';
import Submission from './models/submission';
import { createKnexAdapter } from '../../knex-table-adapter';
import { MecaExporter } from './exporter/meca-exporter';
import { S3Store } from './storage/s3-store';
import { SftpStore } from './storage/sftp-store';
import { SubmissionStore } from './storage/submission-store';
import { InfraLogger as logger } from '../../../logger';
import { MailService } from 'src/domain/mail/services/mail-service';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;

    constructor(
        knex: Knex<{}, unknown[]>,
        private readonly mecaExporter: MecaExporter,
        private readonly s3Store: S3Store,
        private readonly sftpStore: SftpStore,
        private readonly mailService: MailService,
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
        logger.info(`Submission ${id} saved to ${locations}`);

        // @todo: email notification to author
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
            updated: new Date(),
            articleType,
            status: SubmissionStatus.INITIAL,
            createdBy: userId,
        });
        this.setLastStepVisited(submission, 'author');
        return await this.submissionRepository.create(submission);
    }

    async get(id: SubmissionId): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        return submission;
    }

    async delete(id: SubmissionId): Promise<boolean> {
        return await this.submissionRepository.delete(id);
    }

    async submit(submission: Submission, ip: string): Promise<Submission> {
        const id = submission.id;
        if (!submission.isSubmittable()) {
            throw new Error(`The submission ${id} cannot be submitted.`);
        }

        submission.status = SubmissionStatus.MECA_EXPORT_PENDING;
        await this.submissionRepository.update(submission);
        const toEmail = submission.author?.email;
        const data = {
            html: `<p>Dear ${submission.author?.firstName}</p>,
            <p>Thank you for submitting your work, "${submission.manuscriptDetails.title}", to eLife using our new submission interface. Your submission has now been transferred to our legacy system where the editorial evaluation will be carried out.</p>
            <p>You will hear from us again shortly once your submission has undergone our quality check process, at which point you will receive a link to track the progress of your submission.</p>
            
            <p>Best wishes,<p>
            <p>Nicola<p>
            <p>Nicola Adamson (Editorial Assistant)</p>
            <p>
              eLife Sciences Publications, Ltd is a limited liability non-profit non-stock corporation incorporated in the State of Delaware, USA, with company number 5030732, and is registered in the UK with company number FC030576 and branch number BR015634 at the address, Westbrook Centre, Milton Road, Cambridge CB4 1YG.
            </p>
            <p>
              You are receiving this email because you have been identified as the corresponding author of a submission to eLife. If this isn't you please contact editorial@elifesciences.org
            </p>
            `,
            text: `Dear ${submission.author?.firstName},
            Thank you for submitting your work, "${submission.manuscriptDetails.title}", to eLife using our new submission interface. Your submission has now been transferred to our legacy system where the editorial evaluation will be carried out.

            You will hear from us again shortly once your submission has undergone our quality check process, at which point you will receive a link to track the progress of your submission.

            Best wishes,

            Nicola

            Nicola Adamson (Editorial Assistant)

            eLife Sciences Publications, Ltd is a limited liability non-profit non-stock corporation incorporated in the State of Delaware, USA, with company number 5030732, and is registered in the UK with company number FC030576 and branch number BR015634 at the address, Westbrook Centre, Milton Road, Cambridge CB4 1YG.

            You are receiving this email because you have been identified as the corresponding author of a submission to eLife. If this isn't you please contact editorial@elifesciences.org.`,
        };

        // @TODO: send submit email
        // questions:
        // 1. which email address gets emailed
        // 2. BCC/CC required?
        this.mailService.sendEmail();

        this.runMecaExport(submission, ip);
        return this.get(id);
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
}
