import * as Knex from 'knex';
import { SubmissionId } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import uuid = require('uuid');
import Submission from './models/submission';
import { SubmissionDTO } from '../repositories/types';
import { createKnexAdapter } from '../../knex-table-adapter';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.submissionRepository = new XpubSubmissionRootRepository(adapter);
    }

    async findAll(): Promise<Submission[]> {
        const submissions = await this.submissionRepository.findAll();
        return submissions.map((dto: SubmissionDTO) => new Submission(dto));
    }

    async findByUserId(userId: string): Promise<Submission[]> {
        const submissions = await this.submissionRepository.findByUserId(userId);
        return submissions.map((dto: SubmissionDTO) => new Submission(dto));
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
        // this works because Submission interface == SubmissionDTO interface. In future we will probably ned a toDto on the submission or some mapper class
        const savedSubmissionDTO = await this.submissionRepository.create(submission);

        return new Submission(savedSubmissionDTO);
    }

    async get(id: SubmissionId): Promise<Submission> {
        const submissionDTO = await this.submissionRepository.findById(id);
        if (!submissionDTO) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        return new Submission(submissionDTO);
    }

    async delete(id: SubmissionId): Promise<boolean> {
        return await this.submissionRepository.delete(id);
    }
}
