/* eslint-disable @typescript-eslint/camelcase */
import * as Knex from 'knex';
import { InfraLogger as logger } from '../../logger';
import { SubmissionId } from '../types';
import { SubmissionRepository, SubmissionDTO } from './types';

type entryMeta = {
    articleType: string;
    title: string;
};
// this is the xpub schema type
type DatabaseEntry = {
    id: SubmissionId;
    updated: Date;
    created_by: string;
    status: string;
    meta: entryMeta;
};

export default class XpubSubmissionRootRepository implements SubmissionRepository {
    private readonly TABLE_NAME = 'manuscript';

    public constructor(private readonly knex: Knex<{}, unknown[]>) {}

    close(): void {
        logger.log(`Closing XpubSubmissionRootRepository.`);
        this.knex.destroy();
    }

    public async findAll(): Promise<SubmissionDTO[]> {
        const result = await this.knex
            .withSchema('public')
            .select<DatabaseEntry[]>('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME);

        return result.map(this.entryToDTO);
    }

    public async findById(id: SubmissionId): Promise<SubmissionDTO | null> {
        const rows = await this.knex
            .withSchema('public')
            .select<DatabaseEntry[]>('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME)
            .where({ id });

        return rows.length ? this.entryToDTO(rows[0]) : null;
    }

    public async update(dtoSubmission: Partial<SubmissionDTO> & { id: SubmissionId }): Promise<SubmissionDTO> {
        // @todo: do we merge against remote state?
        const submission = await this.findById(dtoSubmission.id);
        if (submission === null) {
            throw new Error(`Unable to find entry with id: ${dtoSubmission.id}`);
        } else {
            const entryToSave = this.dtoToEntry({ ...submission, ...dtoSubmission, updated: new Date() });
            await this.knex
                .withSchema('public')
                .update(entryToSave)
                .into(this.TABLE_NAME);
            return this.entryToDTO(entryToSave);
        }
    }

    public async create(dtoSubmission: Omit<SubmissionDTO, 'updated'>): Promise<SubmissionDTO> {
        const entryToSave = this.dtoToEntry({ ...dtoSubmission, updated: new Date() });
        await this.knex
            .withSchema('public')
            .insert(entryToSave)
            .into(this.TABLE_NAME);
        return this.entryToDTO(entryToSave);
    }

    public async delete(id: SubmissionId): Promise<boolean> {
        const res = await this.knex
            .withSchema('public')
            .from(this.TABLE_NAME)
            .where({ id })
            .delete();
        return res >= 1 ? true : false;
    }

    // These mapping functions are here because xpub schema isn't what we want the dto to look like but we need to convert data sent to something compatible with knex.insert
    private dtoToEntry(dto: SubmissionDTO): DatabaseEntry {
        return {
            id: dto.id,
            updated: dto.updated as Date,
            created_by: dto.createdBy,
            status: dto.status,
            meta: {
                articleType: dto.articleType,
                title: dto.title,
            },
        };
    }

    private entryToDTO(record: DatabaseEntry): SubmissionDTO {
        const { created_by, meta, ...rest } = record;
        return {
            ...rest,
            createdBy: created_by,
            title: meta.title,
            articleType: meta.articleType,
        } as SubmissionDTO;
    }
}
