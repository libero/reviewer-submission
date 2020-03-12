/* eslint-disable @typescript-eslint/camelcase */
import { SubmissionId } from '../types';
import { SubmissionRepository, SubmissionDTO } from './types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import { FileType, FileStatus } from 'src/domain/file/types';

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
        const submission = await this.findById(dtoSubmission.id);
        if (submission === null) {
            throw new Error(`Unable to find entry with id: ${dtoSubmission.id}`);
        }

        const { manuscriptFile, supportingFiles, id, updated, createdBy, status, articleType, title } = dtoSubmission;

        const manuscriptQuery = this._query
            .builder()
            .update({
                id,
                updated,
                created_by: createdBy,
                status: status,
                meta: {
                    articleType: articleType,
                    title: title,
                },
            })
            .table(this.TABLE_NAME);

        await this._query.executor<DatabaseEntry[]>(manuscriptQuery);

        const manuscriptFileEntry = this._query
            .builder()
            .select('id', 'manuscript_id', 'status', 'filename', 'url', 'mime_type', 'size', 'created', 'updated')
            .from('file')
            .where({
                id: manuscriptFile.id,
                manuscript_id: id,
                type: FileType.MANUSCRIPT_SOURCE,
                status: FileStatus.STORED,
            });

        if (manuscriptFileEntry) {
            this._query
                .builder()
                .table(this.TABLE_NAME)
                .update({
                    id: manuscriptFile.id,
                    manuscript_id: manuscriptFile.submissionId,
                })
                .where({ id: manuscriptFile.id });
        }


        // // const manuscriptFileQuery = this._query.builder().insert(manuscriptFileEntry);

        // const entryToSave = this.dtoToEntry({ ...submission, ...dtoSubmission, updated: new Date() });
        // const query = this._query.builder().update(entryToSave);
        // await this._query.executor<DatabaseEntry[]>(query);
        // return this.entryToDTO(entryToSave);
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
