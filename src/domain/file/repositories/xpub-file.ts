/* eslint-disable @typescript-eslint/camelcase */
import { KnexTableAdapter } from '../../knex-table-adapter';
import { SubmissionId } from '../../submission/types';
import { FileId, FileType, FileStatus } from '../types';
import { FileDTO } from './types';

interface FileRepository {
    create(dtoFile: Omit<FileDTO, 'updated'>): Promise<FileDTO>;
}

type DatabaseEntry = {
    id: FileId;
    manuscript_id: SubmissionId;
    status: string;
    filename: string;
    url: string;
    mime_type: string;
    size: number;
    created: Date;
    updated: Date;
};

export default class XpubFileRepository implements FileRepository {
    private readonly TABLE_NAME = 'file';

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
            .select('id', 'manuscript_id', 'status', 'filename', 'url', 'mime_type', 'size', 'created', 'updated')
            .from(this.TABLE_NAME)
            .where({ id, status: FileStatus.STORED });

        const files = await this._query.executor<DatabaseEntry[]>(query);
        return files.length > 0 ? this.entryToDto(files[0]) : null;
    }

    async deleteById(id: FileId): Promise<boolean> {
        const file = await this.findFileById(id);
        if (file === null) {
            throw new Error(`Unable to find entry with id: ${id}`);
        }
        const entryToSave = this.dtoToEntry({ ...file, updated: new Date(), status: FileStatus.DELETED });
        const query = this._query
            .builder()
            .table(this.TABLE_NAME)
            .update(entryToSave)
            .where({ id: id });
        await this._query.executor(query);
        return true;
    }

    async findManuscriptBySubmssionId(id: SubmissionId): Promise<FileDTO | null> {
        const query = this._query
            .builder()
            .select('id', 'manuscript_id', 'status', 'filename', 'url', 'mime_type', 'size', 'created', 'updated')
            .from(this.TABLE_NAME)
            .where({ manuscript_id: id, type: FileType.MANUSCRIPT_SOURCE, status: FileStatus.STORED });

        const files = await this._query.executor<DatabaseEntry[]>(query);
        return files.length > 0 ? this.entryToDto(files[0]) : null;
    }

    async update(dtoFile: FileDTO): Promise<FileDTO> {
        const file = await this.findFileById(dtoFile.id);
        if (file === null) {
            throw new Error(`Unable to find entry with id: ${dtoFile.id}`);
        }
        const entryToSave = this.dtoToEntry({ ...file, ...dtoFile, updated: new Date() });
        const query = this._query
            .builder()
            .table(this.TABLE_NAME)
            .update(entryToSave)
            .where({ id: dtoFile.id });
        await this._query.executor(query);
        return this.entryToDto(entryToSave);
    }

    dtoToEntry(dto: FileDTO): DatabaseEntry {
        const { submissionId, mimeType, ...rest } = dto;
        return {
            ...rest,
            manuscript_id: submissionId,
            mime_type: mimeType,
        } as DatabaseEntry;
    }

    entryToDto(record: DatabaseEntry): FileDTO {
        const { manuscript_id, mime_type, ...rest } = record;
        return {
            ...rest,
            submissionId: manuscript_id,
            mimeType: mime_type,
        } as FileDTO;
    }
}
