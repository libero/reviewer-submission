/* eslint-disable @typescript-eslint/camelcase */
import { KnexTableAdapter } from '../../knex-table-adapter';
import { SubmissionId } from '../../submission/types';
import { FileId, FileType, FileStatus } from '../types';
import File from '../services/models/file';

type DatabaseEntry = {
    id: FileId;
    manuscript_id: SubmissionId;
    filename: string;
    url: string;
    mime_type: string;
    size: number;
    created: Date;
    updated: Date;
    status: string;
    type: FileType;
};

export default class XpubFileRepository {
    private readonly TABLE_NAME = 'file';

    public constructor(private readonly _query: KnexTableAdapter) {}

    async create(file: File): Promise<File> {
        // const entryToSave = this.dtoToEntry({ ...dtoFile, updated: new Date() });
        const query = this._query
            .builder()
            .insert(this.modelToEntry(file))
            .into(this.TABLE_NAME);

        await this._query.executor(query);
        return file;
    }

    async findFileById(id: FileId): Promise<File | null> {
        const query = this._query
            .builder()
            .select(
                'id',
                'manuscript_id',
                'status',
                'filename',
                'url',
                'mime_type',
                'size',
                'type',
                'created',
                'updated',
            )
            .from(this.TABLE_NAME)
            .where({ id });

        const files = await this._query.executor<DatabaseEntry[]>(query);
        return files.length > 0 ? this.entryToModel(files[0]) : null;
    }

    async findManuscriptBySubmissionId(id: SubmissionId): Promise<File | null> {
        const query = this._query
            .builder()
            .select(
                'id',
                'manuscript_id',
                'status',
                'filename',
                'url',
                'mime_type',
                'size',
                'type',
                'created',
                'updated',
            )
            .from(this.TABLE_NAME)
            .where({ manuscript_id: id, type: FileType.MANUSCRIPT_SOURCE, status: FileStatus.STORED });

        const files = await this._query.executor<DatabaseEntry[]>(query);
        if (files.length > 1) {
            const ids = files.map(item => item.id);
            throw new Error(`Too many manuscripts on submission: ${JSON.stringify(ids, null, 4)}`);
        }
        return files.length > 0 ? this.entryToModel(files[0]) : null;
    }

    async getSupportingFilesBySubmissionId(id: SubmissionId): Promise<Array<File>> {
        const query = this._query
            .builder()
            .select(
                'id',
                'manuscript_id',
                'status',
                'filename',
                'url',
                'mime_type',
                'size',
                'type',
                'created',
                'updated',
            )
            .from(this.TABLE_NAME)
            .where({ manuscript_id: id, type: FileType.SUPPORTING_FILE, status: FileStatus.STORED });

        const files = await this._query.executor<DatabaseEntry[]>(query);
        return files.length > 0 ? files.map(this.entryToModel) : [];
    }

    async update(file: File): Promise<File> {
        const existingFile = await this.findFileById(file.id);
        if (existingFile === null) {
            throw new Error(`Unable to find entry with id: ${file.id}`);
        }
        file.updated = new Date();
        const entryToSave = this.modelToEntry(file);
        const query = this._query
            .builder()
            .table(this.TABLE_NAME)
            .update(entryToSave)
            .where({ id: file.id });
        await this._query.executor(query);
        return this.entryToModel(entryToSave);
    }

    modelToEntry(file: File): DatabaseEntry {
        const { submissionId, mimeType, ...rest } = file;
        return {
            ...rest,
            manuscript_id: submissionId,
            mime_type: mimeType,
        } as DatabaseEntry;
    }

    entryToModel(record: DatabaseEntry): File {
        const {
            manuscript_id: submissionId,
            type,
            mime_type: mimeType,
            id,
            created,
            updated,
            filename,
            size,
            status,
        } = record;
        return new File({ id, submissionId, created, updated, type, filename, mimeType, size, status });
    }
}
