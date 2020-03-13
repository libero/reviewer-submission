import * as Knex from 'knex';
import { SubmissionId, SubmissionWriter, SubmissionExporter } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 as uuid } from 'uuid';
import Submission from './models/submission';
import { createKnexAdapter } from '../../knex-table-adapter';
import { MecaExporter } from './meca-exporter';
import { S3Store } from './s3-store';
import { SftpStore } from './sftp-store';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;
    submissionExporter: SubmissionExporter;
    s3Store: SubmissionWriter;
    sftpStore: SubmissionWriter;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.submissionRepository = new XpubSubmissionRootRepository(adapter);
        this.submissionExporter = new MecaExporter();
        this.s3Store = new S3Store();
        this.sftpStore = new SftpStore();
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
            title: '',
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

    async submit(id: SubmissionId): Promise<Submission> {
        // @todo: Validate the submission?
        const buffer = await this.submissionExporter.export(id);

        // Upload
        const internalLocation = this.s3Store.write(id, buffer);
        const externalLocation = this.externalWriter.write(id, buffer);
        await Promise.all([internalLocation, externalLocation]);

        // @todo: email notification to author
    }
}
