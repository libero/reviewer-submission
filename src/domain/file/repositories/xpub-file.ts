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
}

type DatabaseEntry = {
    id: FileId;
    manuscript_id: SubmissionId;
    status: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
};

export default class XpubFileRepository implements FileRepository {
    private readonly TABLE_NAME = 'manuscript';

    public constructor(private readonly _query: KnexTableAdapter) {}

    // TODO: stub for now
    async create(dtoFile: Omit<FileDTO, 'updated'>): Promise<FileDTO> {
        const entryToSave = this.dtoToEntry({ ...dtoFile, updated: new Date() });
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME);

        await this._query.executor<FileDTO[]>(query);
        return this.entryToDto(entryToSave);
    }

    dtoToEntry(dto: FileDTO): DatabaseEntry {
        return {
            id: dto.id,
        } as DatabaseEntry;
    }

    entryToDto(record: DatabaseEntry): FileDTO {
        return {
            id: record.id,
        } as FileDTO;
    }
}
