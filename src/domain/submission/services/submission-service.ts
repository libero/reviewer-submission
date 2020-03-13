import * as Knex from 'knex';
import { SubmissionId } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 as uuid } from 'uuid';
import Submission from './models/submission';
import { createKnexAdapter } from '../../knex-table-adapter';

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

    async changeCoverLetter(id: SubmissionId, coverLetter: string): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (!submission) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        submission.coverLetter = coverLetter;
        return await this.submissionRepository.update(submission);
    }
}
