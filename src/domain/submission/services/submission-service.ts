import * as Knex from 'knex';
import { SubmissionId, ManuscriptDetails } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 as uuid } from 'uuid';
import Submission from './models/submission';
import { createKnexAdapter } from '../../knex-table-adapter';
import { MecaExporter } from './exporter/meca-exporter';
import { S3Store } from './storage/s3-store';
import { SftpStore } from './storage/sftp-store';
import { SubmissionStore } from './storage/submission-store';
import { InfraLogger as logger } from '../../../logger';
import { FileService } from 'src/domain/file/services/file-service';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;

    constructor(knex: Knex<{}, unknown[]>, private readonly fileService: FileService) {
        const adapter = createKnexAdapter(knex, 'public');
        this.submissionRepository = new XpubSubmissionRootRepository(adapter);
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
            status: 'INITIAL',
            createdBy: userId,
        });
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

    async submit(id: SubmissionId, ip: string): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Unable to find submission with id: ' + id);
        }

        if (!submission.isSubmittable()) {
            throw new Error(`The submission ${id} cannot be submitted.`);
        }

        const exporter = new MecaExporter(this.fileService);
        const buffer = await exporter.export(submission, ip);

        // @todo: initialise with config
        const store = new SubmissionStore([new S3Store(), new SftpStore()]);
        const locations = await store.write(id, buffer);
        logger.info(`Submission ${id} saved to ${locations}`);

        // @todo: email notification to author

        return this.get(id);
    }

    async changeCoverLetter(id: SubmissionId, coverLetter: string): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        submission.files.coverLetter = coverLetter;
        return await this.submissionRepository.update(submission);
    }

    async saveDetailsPage(id: SubmissionId, details: ManuscriptDetails): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        submission.manuscriptDetails = details;
        return await this.submissionRepository.update(submission);
    }

    async addEditorDetails(
        id: SubmissionId,
        opposedReviewersReason?: string,
        opposedReviewingEditorsReason?: string,
        opposedSeniorEditorsReason?: string,
    ): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        submission.addEditorFeedback(opposedReviewersReason, opposedReviewingEditorsReason, opposedSeniorEditorsReason);
        return await this.submissionRepository.update(submission);
    }
}
