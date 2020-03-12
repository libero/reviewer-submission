/* eslint-disable @typescript-eslint/camelcase */
import { SubmissionId, Details } from '../types';
import { SubmissionRepository, SubmissionDTO } from './types';
import { KnexTableAdapter } from '../../knex-table-adapter';

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
    subjects: string[];
    previouslyDiscussed: string;
    previouslySubmitted: string[];
    cosubmission: string[];
};

export default class XpubSubmissionRootRepository implements SubmissionRepository {
    private readonly TABLE_NAME = 'manuscript';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async findAll(): Promise<SubmissionDTO[]> {
        const query = this._query
            .builder()
            .select('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME);
        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.map(this.entryToDTO);
    }

    public async findByUserId(userId: string): Promise<SubmissionDTO[]> {
        const query = this._query
            .builder()
            .select('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME)
            .where({ created_by: userId });

        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.map(this.entryToDTO);
    }

    public async findById(id: SubmissionId): Promise<SubmissionDTO | null> {
        const query = this._query
            .builder()
            .select('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME)
            .where({ id });
        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.length ? this.entryToDTO(result[0]) : null;
    }

    public async update(dtoSubmission: Partial<SubmissionDTO> & { id: SubmissionId }): Promise<SubmissionDTO> {
        // @todo: do we merge against remote state?
        // ... ISSUE use select for update
        const submission = await this.findById(dtoSubmission.id);
        if (submission === null) {
            throw new Error(`Unable to find entry with id: ${dtoSubmission.id}`);
        }
        const entryToSave = this.dtoToEntry({ ...submission, ...dtoSubmission, updated: new Date() });
        const query = this._query.builder().update(entryToSave);
        await this._query.executor<DatabaseEntry[]>(query);
        return this.entryToDTO(entryToSave);
    }

    public async create(dtoSubmission: Omit<SubmissionDTO, 'updated'>): Promise<SubmissionDTO> {
        const entryToSave = this.dtoToEntry({ ...dtoSubmission, updated: new Date() });
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME);
        await this._query.executor<DatabaseEntry[]>(query);
        return this.entryToDTO(entryToSave);
    }

    public async delete(id: SubmissionId): Promise<boolean> {
        const query = this._query
            .builder()
            .table(this.TABLE_NAME)
            .where({ id })
            .delete();
        const result = await this._query.executor<number>(query);
        return result >= 1 ? true : false;
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
            previouslyDiscussed: dto.previouslyDiscussed,
            previouslySubmitted: dto.previouslySubmitted,
            subjects: dto.subjects,
            cosubmission: dto.cosubmission,
        };
    }

    private entryToDTO(record: DatabaseEntry): SubmissionDTO {
        const { created_by, meta, ...rest } = record;
        // @todo: This should fetch all the other data too
        return {
            ...rest,
            createdBy: created_by,
            title: meta.title,
            articleType: meta.articleType,
        } as SubmissionDTO;
    }
}
