import { SubmissionRepository, DtoSubmission, SubmissionId, Submission } from '../types/submission';
import * as Knex from 'knex';
import { InfraLogger as logger } from '../logger';
import { SubmissionMapper } from '../entities/submission';

export class KnexSubmissionRepository implements SubmissionRepository {
    private readonly TABLE_NAME = 'manuscript';

    public constructor(private readonly knex: Knex<{}, unknown[]>) {}

    close(): void {
        logger.log(`Closing KnexSubmissionRepository.`);
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
