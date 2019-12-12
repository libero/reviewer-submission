import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as Knex from 'knex';
import { SubmissionController } from '../../packages/submission/submission.controller';
import { KnexSubmissionRepository } from './submission.repo';
import { Submission } from '../../packages/submission/submission.entity';
import { ISubmission } from '../../packages/submission/submission.repository';
import { ConfigService } from '../config/config.service';
import { Option, Some, None } from 'funfix';
import { SubmissionId } from '../../packages/submission/submission.repository';

export type SubmissionServiceConfig = {
    getSubmissionRepositoryConnection(): string;
};
@Injectable()
export class SubmissionService implements OnModuleDestroy {
    controller: Option<SubmissionController> = None;

    constructor(config: ConfigService) {
        const knexConnection = Knex(config.getSubmissionRepositoryConnection());

        const submissionRepo = new KnexSubmissionRepository(knexConnection);
        submissionRepo.initSchema();

        this.controller = Some(new SubmissionController(submissionRepo));
    }

    onModuleDestroy(): void {
        this.controller.get().close();
        this.controller = None;
    }

    async findAll(): Promise<Submission[]> {
        return await this.controller.map(controller => controller.findAll()).get();
    }

    async start(): Promise<ISubmission> {
        return this.controller.map(controller => controller.start()).get();
    }

    async findOne(id: SubmissionId): Promise<Submission> {
        return this.controller.map(controller => controller.findOne(id)).get();
    }

    async changeTitle(id: SubmissionId, title: string): Promise<Submission> {
        return this.controller.map(controller => controller.changeTitle(id, title)).get();
    }

    async deleteSubmission(id: SubmissionId): Promise<boolean> {
        return this.controller.map(controller => controller.deleteSubmission(id)).get();
    }
}
