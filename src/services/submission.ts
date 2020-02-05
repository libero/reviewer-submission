import * as Knex from 'knex';
import { SubmissionId, DtoViewSubmission } from '../types/submission';
import { KnexSubmissionRepository } from '../repositories/submission';
// REMOVE MAYBE? Probably
export type SubmissionServiceConfig = {
    getSubmissionRepositoryConnection(): string;
};

export class SubmissionService {
    submissionRepository: KnexSubmissionRepository;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        this.submissionRepository = new KnexSubmissionRepository(knexConnection);
    }

    async findAll(): Promise<DtoViewSubmission[]> {
        return this.submissionRepository.findAll();
    }

    async create(articleType: string): Promise<DtoViewSubmission | null> {
        return this.submissionRepository.create(articleType);
    }

    async findOne(id: SubmissionId): Promise<DtoViewSubmission | null> {
        return this.submissionRepository.findById(id);
    }

    async changeTitle(id: SubmissionId, title: string): Promise<DtoViewSubmission | null> {
        return this.submissionRepository.changeTitle(id, title);
    }

    async delete(id: SubmissionId): Promise<boolean> {
        return this.submissionRepository.delete(id);
    }
}
