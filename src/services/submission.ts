import * as Knex from 'knex';
import { Option } from 'funfix';
import { SubmissionController } from '../controllers/submission';
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

    async findAll(): Promise<Option<DtoViewSubmission[]>> {
        return this.submissionRepository.findAll();
    }

    async create(articleType: string): Promise<Option<DtoViewSubmission>> {
        return this.submissionRepository.create(articleType);
    }

    async findOne(id: SubmissionId): Promise<Option<DtoViewSubmission>> {
        return this.submissionRepository.findById(id);
    }

    async changeTitle(id: SubmissionId, title: string): Promise<Option<DtoViewSubmission>> {
        return this.submissionRepository.changeTitle(id, title);
    }

    async delete(id: SubmissionId): Promise<number> {
        return this.submissionRepository.delete(id);
    }
}
