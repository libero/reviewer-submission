import { SubmissionRepository, DtoSubmission, SubmissionId, Submission } from '../types/submission';
import * as Knex from 'knex';
import { InfraLogger as logger } from '../logger';
import { SubmissionMapper } from '../entities/submission';

export class KnexSubmissionRepository implements SubmissionRepository {
    private readonly TABLE_NAME = 'manuscript';
    // private readonly logger = new Logger(KnexSubmissionRepository.name);

    public constructor(private readonly knex: Knex<{}, unknown[]>) {}

    public async initSchema(): Promise<boolean | void> {
        // TODO: Add a method for handling when the table does/doesn't exist
        // as this will error if the table already exists
        // XXX: Maybe move this to migrations
        const hasTable = await this.knex.schema.withSchema('public').hasTable(this.TABLE_NAME);

        if (hasTable) {
            return hasTable;
        }

        return await this.knex.schema
            .withSchema('public')
            .createTable(this.TABLE_NAME, (table: Knex.CreateTableBuilder) => {
                table.uuid('id');
                table.timestamp('updated').defaultTo(this.knex.fn.now());
                table.string('status');
                table.string('created_by');
                table.jsonb('meta');
                logger.info(`created table ${this.TABLE_NAME}`);
            });
    }

    close(): void {
        logger.log(`Closing repository.`);
        this.knex.destroy();
    }

    public async findAll(): Promise<Submission[]> {
        const result = await this.knex
            .withSchema('public')
            .select<DtoSubmission[]>('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME);
        return result.map(SubmissionMapper.fromDto);
    }

    public async findById(id: SubmissionId): Promise<Submission | null> {
        const rows = await this.knex
            .withSchema('public')
            .select<DtoSubmission[]>('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME)
            .where({ id });

        return rows.length > 0 ? SubmissionMapper.fromDto(rows[0]) : null;
    }

    public async save(sub: Submission): Promise<Submission | null> {
        const dtoSubmission: DtoSubmission = SubmissionMapper.toDto(sub);
        dtoSubmission.updated = new Date();
        await this.knex
            .withSchema('public')
            .insert(dtoSubmission)
            .into(this.TABLE_NAME)
            .returning('id');

        return SubmissionMapper.fromDto(dtoSubmission);
    }

    public async delete(id: SubmissionId): Promise<boolean> {
        const res = await this.knex
            .withSchema('public')
            .from(this.TABLE_NAME)
            .where({ id })
            .delete();
        return res >= 1 ? true : false;
    }
}
