// This should probably be called something else
import { v4 as uuid } from 'uuid';
import { SubmissionRepository, DtoSubmission, SubmissionId, Submission } from '../types/submission';
import * as Knex from 'knex';
import { Logger } from '@nestjs/common';
import { SubmissionMapper, SubmissionEntity } from '../entities/submission';

export class KnexSubmissionRepository implements SubmissionRepository {
    private readonly TABLE_NAME = 'submission';
    private readonly logger = new Logger(KnexSubmissionRepository.name);

    public constructor(private readonly knex: Knex<{}, unknown[]>) {}

    public async initSchema(): Promise<boolean | void> {
        // TODO: Add a method for handling when the table does/doesn't exist
        // as this will error if the table already exists
        // XXX: Maybe move this to migrations
        const hasTable = await this.knex.schema.hasTable(this.TABLE_NAME);

        if (hasTable) {
            return hasTable;
        }

        return await this.knex.schema.createTable(this.TABLE_NAME, (table: Knex.CreateTableBuilder) => {
            table.uuid('id');
            table.string('title');
            table.timestamp('updated').defaultTo(this.knex.fn.now());
            this.logger.log(`created table ${this.TABLE_NAME}`);
        });
    }

    close(): void {
        this.logger.log(`Closing repository.`);
        this.knex.destroy();
    }

    // TODO: this shouldn't be here
    public async create(articleType: string): Promise<Submission | null> {
        const id = SubmissionId.fromUuid(uuid());
        const se = new SubmissionEntity({ id, title: '', updated: new Date(), articleType });
        return this.save(se);
    }

    public async findAll(): Promise<Submission[]> {
        const result = await this.knex(this.TABLE_NAME).select<DtoSubmission[]>('id', 'title', 'updated');
        return result.map(SubmissionMapper.fromDto);
    }

    public async findById(id: SubmissionId): Promise<Submission | null> {
        const rows = await this.knex(this.TABLE_NAME)
            .where({ id })
            .select<DtoSubmission[]>('id', 'title', 'updated');

        return rows.length > 0 ? SubmissionMapper.fromDto(rows[0]) : null;
    }

    public async save(sub: Submission): Promise<Submission | null> {
        const dtoSubmission: DtoSubmission = SubmissionMapper.toDto(sub);
        dtoSubmission.updated = new Date();
        await this.knex(this.TABLE_NAME)
            .insert(dtoSubmission)
            .returning('id');
        return SubmissionMapper.fromDto(dtoSubmission);
    }

    // TODO: move to service
    public async changeTitle(id: SubmissionId, title: string): Promise<Submission | null> {
        const result = await this.findById(id);
        if (result === null) {
            return result;
        }
        const resultToSave: Submission = { ...result, title };
        return this.save(resultToSave);
    }

    public async delete(id: SubmissionId): Promise<boolean> {
        const res = await this.knex(this.TABLE_NAME)
            .where({ id })
            .delete();
        return res >= 1 ? true : false;
    }
}
