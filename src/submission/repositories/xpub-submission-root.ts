/* eslint-disable @typescript-eslint/camelcase */
import * as Knex from 'knex';
import { InfraLogger as logger } from '../../logger';
import { SubmissionId } from '../types';
import { SubmissionRepository, SubmissionDTO } from './types';

type entryMeta = {
    articleType: string;
    title: string;
};
// this is the xpub shema type
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
        logger.log(`Closing KnexSubmissionRepository.`);
        this.knex.destroy();
    }

    public async findAll(): Promise<SubmissionDTO[]> {
        const result = await this.knex
            .withSchema('public')
            .select<DatabaseEntry[]>('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME);

        return result.map(this.entryToDTO);
    }

    public async findById(id: SubmissionId): Promise<SubmissionDTO> {
        const rows = await this.knex
            .withSchema('public')
            .select<DatabaseEntry[]>('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME)
            .where({ id });

        return this.entryToDTO(rows[0]);
    }

    public async save(dtoSubmission: Partial<SubmissionDTO> & { id: SubmissionId }): Promise<SubmissionDTO> {
        // @todo: do we merge against remote state?
        const submission = await this.findById(dtoSubmission.id);
        const dtoToSave = this.dtoToEntry({ ...submission, ...dtoSubmission, updated: new Date() });
        if (submission === null) {
            await this.knex
                .withSchema('public')
                .insert(dtoToSave)
                .into(this.TABLE_NAME);
        } else {
            await this.knex
                .withSchema('public')
                .update(dtoToSave)
                .into(this.TABLE_NAME);
        }
        return this.entryToDTO(dtoToSave);
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
            updated: dto.updated,
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
