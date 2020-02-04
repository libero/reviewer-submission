// This should probably be called something else
import { v4 as uuid } from 'uuid';
import { SubmissionRepository, DtoSubmission, SubmissionId, Submission } from '../types/submission.types';
import { Option, None } from 'funfix';
import * as Knex from 'knex';
import { Logger } from '@nestjs/common';
import { SubmissionMapper, SubmissionEntity } from '../types/submission.entity';

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

    public async create(): Promise<Option<Submission>> {
        const id = SubmissionId.fromUuid(uuid());
        const se = new SubmissionEntity({ id, title: '', updated: new Date() });
        return this.save(se);
    }

    public async findAll(): Promise<Option<Submission[]>> {
        return new Promise(resolve => {
            this.knex(this.TABLE_NAME)
                .select<DtoSubmission[]>('id', 'title', 'updated')
                .then(items => {
                    resolve(Option.of(items.map(SubmissionMapper.fromDto)));
                })
                .catch(() => {
                    resolve(None);
                });
        });
    }

    public async findById(id: SubmissionId): Promise<Option<Submission>> {
        const rows = await this.knex(this.TABLE_NAME)
            .where({ id })
            .select<DtoSubmission[]>('id', 'title', 'updated');

        return rows.length > 0 ? Option.of(SubmissionMapper.fromDto(rows[0])) : None;
    }

    public async save(sub: Submission): Promise<Option<Submission>> {
        const dtoSubmission: DtoSubmission = SubmissionMapper.toDto(sub);
        dtoSubmission.updated = new Date();

        return new Promise(resolve => {
            this.knex(this.TABLE_NAME)
                .insert(dtoSubmission)
                .returning('id')
                .then(() => {
                    resolve(Option.of(SubmissionMapper.fromDto(dtoSubmission)));
                })
                .catch(() => {
                    resolve(None);
                });
        });
    }

    public async changeTitle(id: SubmissionId, title: string): Promise<Option<Submission>> {
        const result = await this.findById(id);
        if (result.isEmpty()) {
            return None;
        } else {
            result.get().title = title;
            return this.save(result.get());
        }
    }

    public async delete(id: SubmissionId): Promise<number> {
        return new Promise(resolve => {
            this.knex(this.TABLE_NAME)
                .where({ id })
                .delete()
                .then(res => {
                    if (res > 1) {
                        this.logger.error(`Unexpected deleting ${res} items using ${id} from ${this.TABLE_NAME}`);
                    }
                    resolve(res);
                })
                .catch(() => {
                    resolve(0);
                });
        });
    }
}
