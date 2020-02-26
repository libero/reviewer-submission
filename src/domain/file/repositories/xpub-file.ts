import { KnexTableAdapter } from '../../knex-table-adapter';
import { SubmissionId } from 'src/domain/submission/types';

interface FileRepository {
    create(
        submisisonId: SubmissionId,
        status: string,
        filename: string,
        url: string,
        mimeType: string,
        size: number,
    ): Promise<boolean>;
}

interface FileDTO {
    submisisonId: SubmissionId;
    status: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
}

export default class XpubFileRepository implements FileRepository {
    private readonly TABLE_NAME = 'manuscript';

    public constructor(private readonly _query: KnexTableAdapter) {}

    // TODO: stub for now
    async create(file: Omit<FileDTO, 'updated' | 'created'>): Promise<boolean> {
        const query = this._query;
        return true;
    }

    async entryToDto(dto: FileDTO) {}

    async dtoToEntry(record: DatabaseEntry) {}
}
