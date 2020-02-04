import * as Knex from 'knex';
import { Option } from 'funfix';
import { SubmissionController } from '../controllers/submission';
import { SubmissionId, DtoViewSubmission } from '../types/submission.types';
import { KnexSubmissionRepository } from '../repositories/submission';
// REMOVE MAYBE? Probably
export type SubmissionServiceConfig = {
    getSubmissionRepositoryConnection(): string;
};

export class SubmissionService {
    controller: SubmissionController;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        const submissionRepo = new KnexSubmissionRepository(knexConnection);
        submissionRepo.initSchema();

        this.controller = new SubmissionController(submissionRepo);
    }

    async findAll(): Promise<Option<DtoViewSubmission[]>> {
        return this.controller.findAll();
    }

    async create(articleType: string): Promise<Option<DtoViewSubmission>> {
        return this.controller.create(articleType);
    }

    async findOne(id: SubmissionId): Promise<Option<DtoViewSubmission>> {
        return this.controller.findOne(id);
    }

    async changeTitle(id: SubmissionId, title: string): Promise<Option<DtoViewSubmission>> {
        return this.controller.changeTitle(id, title);
    }

    async delete(id: SubmissionId): Promise<number> {
        return this.controller.delete(id);
    }
}
