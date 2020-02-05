import { SubmissionRepository, DtoSubmission, SubmissionId, Submission } from '../types/submission';
import * as Knex from 'knex';
import { Logger } from '@nestjs/common';
import { SubmissionMapper } from '../entities/submission';

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

    public async delete(id: SubmissionId): Promise<boolean> {
        const res = await this.knex(this.TABLE_NAME)
            .where({ id })
            .delete();
        return res >= 1 ? true : false;
    }
}
