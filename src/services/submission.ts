import * as Knex from 'knex';
import { SubmissionId, DtoViewSubmission, Submission } from '../types/submission';
import { KnexSubmissionRepository } from '../repositories/submission';
import uuid = require('uuid');
import { SubmissionEntity } from '../entities/submission';

export class SubmissionService {
    submissionRepository: KnexSubmissionRepository;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        this.submissionRepository = new KnexSubmissionRepository(knexConnection);
    }

    async findAll(): Promise<DtoViewSubmission[]> {
        return await this.submissionRepository.findAll();
    }

    async create(articleType: string): Promise<DtoViewSubmission | null> {
        const id = SubmissionId.fromUuid(uuid());
        const submission = new SubmissionEntity({ id, title: '', updated: new Date(), articleType });
        return await this.submissionRepository.save(submission);
    }

    async findOne(id: SubmissionId): Promise<DtoViewSubmission | null> {
        return await this.submissionRepository.findById(id);
    }

    async changeTitle(id: SubmissionId, title: string): Promise<DtoViewSubmission | null> {
        const result = await this.submissionRepository.findById(id);
        if (result === null) {
            return result;
        }
        const resultToSave: Submission = { ...result, title };
        return await this.submissionRepository.save(resultToSave);
    }

    async delete(id: SubmissionId): Promise<boolean> {
        return await this.submissionRepository.delete(id);
    }
}
