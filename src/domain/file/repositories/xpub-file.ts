/* eslint-disable @typescript-eslint/camelcase */
import { KnexTableAdapter } from '../../knex-table-adapter';
import { SubmissionId } from '../../submission/types';
import { FileId } from '../types';

interface FileRepository {
    create(dtoFile: Omit<FileDTO, 'updated'>): Promise<FileDTO>;
}

interface FileDTO {
    id: FileId;
    submissionId: SubmissionId;
    status: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    created: Date;
    updated: Date;
}

type DatabaseEntry = {
    id: FileId;
    manuscript_id: SubmissionId;
    status: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    created: Date;
    updated: Date;
};

export default class XpubFileRepository implements FileRepository {
    private readonly TABLE_NAME = 'manuscript';

    public constructor(private readonly _query: KnexTableAdapter) {}

    async create(dtoFile: Omit<FileDTO, 'updated'>): Promise<FileDTO> {
        const entryToSave = this.dtoToEntry({ ...dtoFile, updated: new Date() });
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME);

        await this._query.executor<FileDTO[]>(query);
        return this.entryToDto(entryToSave);
    }

    async findFileById(id: FileId): Promise<FileDTO | null> {
        const query = this._query
            .builder()
            .select('id', 'manuscript_id', 'status', 'filename', 'url', 'mimeType', 'size', 'created', 'updated')
            .from(this.TABLE_NAME)
            .where({ id });

        const files = await this._query.executor<DatabaseEntry[]>(query);
        return files.length > 0 ? this.entryToDto(files[0]) : null;
    }

    async findManuscriptBySubmssionId(id: SubmissionId): Promise<FileDTO | null> {
        const query = this._query
            .builder()
            .select('id', 'manuscript_id', 'status', 'filename', 'url', 'mimeType', 'size', 'created', 'updated')
            .from(this.TABLE_NAME)
            .where({ manuscript_id: id });

        const files = await this._query.executor<DatabaseEntry[]>(query);
        return files.length > 0 ? this.entryToDto(files[0]) : null;
    }

    async update(dtoFile: FileDTO): Promise<FileDTO> {
        const file = await this.findFileById(dtoFile.id);
        if (file === null) {
            throw new Error(`Unable to find entry with id: ${dtoFile.id}`);
        }
        const entryToSave = { ...file, ...dtoFile, updated: new Date() };
        const query = this._query
            .builder()
            .table(this.TABLE_NAME)
            .update(entryToSave)
            .where({ id: dtoFile.id });
        await this._query.executor(query);
        return entryToSave;
    }

    dtoToEntry(dto: FileDTO): DatabaseEntry {
        const { submissionId, ...rest } = dto;
        return {
            ...rest,
            manuscript_id: submissionId,
        } as DatabaseEntry;
    }

    entryToDto(record: DatabaseEntry): FileDTO {
        const { manuscript_id, ...rest } = record;
        return {
            ...rest,
            submissionId: manuscript_id,
        } as FileDTO;
    }
}
