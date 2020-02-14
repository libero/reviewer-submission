import { SubmissionRepository, DtoSubmission, SubmissionId, Submission } from '../submission';
import * as Knex from 'knex';
import { InfraLogger as logger } from '../../logger';
import { SubmissionMapper } from '../models/submission';

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

    public async insert(sub: Submission): Promise<Submission | null> {
        const dtoSubmission: DtoSubmission = SubmissionMapper.toDto(sub);
        await this.knex
            .withSchema('public')
            .update(dtoSubmission)
            .into(this.TABLE_NAME);
        return SubmissionMapper.fromDto(dtoSubmission);
    }

    public async save(sub: Submission): Promise<Submission | null> {
        // @todo: do we merge against remote state?
        const submission = await this.findById(sub.id);
        if (submission === null) {
            return null;
        }
        const dtoSubmission: DtoSubmission = SubmissionMapper.toDto(sub);
        const dtoToSave = { ...dtoSubmission, updated: new Date() };
        await this.knex
            .withSchema('public')
            .insert(dtoToSave)
            .into(this.TABLE_NAME);

        return SubmissionMapper.fromDto(dtoToSave);
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
