import * as Knex from 'knex';
import { SubmissionId } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 as uuid } from 'uuid';
import Submission from './models/submission';
import { createKnexAdapter } from '../../knex-table-adapter';
import { MecaExporter } from './exporter/meca-exporter';
import { S3Store } from './storage/s3-store';
import { SftpStore } from './storage/sftp-store';
import { SubmissionStore } from './storage/submission-store';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;

    constructor(knex: Knex<{}, unknown[]>) {
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
        const exporter = new MecaExporter();
        const buffer = await exporter.export(id);

        // @todo: initialise with config
        const store = new SubmissionStore([new S3Store(), new SftpStore()]);
        const locations = await store.write(id, buffer);

        // @todo: email notification to author

        return this.get(id);
    }
}
