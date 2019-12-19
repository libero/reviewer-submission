import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as Knex from 'knex';
import { Option } from 'funfix';
import { SubmissionController } from '../../packages/submission/submission.controller';
import { ConfigService } from '../config/config.service';
import { SubmissionId, DtoViewSubmission } from '../../packages/submission/submission.types';
import { KnexSubmissionRepository } from './submission.repository';

export type SubmissionServiceConfig = {
    getSubmissionRepositoryConnection(): string;
};
@Injectable()
export class SubmissionService implements OnModuleDestroy {
    controller: SubmissionController;

    constructor(config: ConfigService) {
        const knexConnection = Knex(config.getSubmissionRepositoryConnection());

        const submissionRepo = new KnexSubmissionRepository(knexConnection);
        submissionRepo.initSchema();

        this.controller = new SubmissionController(submissionRepo);
    }

    onModuleDestroy(): void {
        this.controller.close();
    }

    async findAll(): Promise<Option<DtoViewSubmission[]>> {
        return this.controller.findAll();
    }

    async create(): Promise<Option<DtoViewSubmission>> {
        return this.controller.create();
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
