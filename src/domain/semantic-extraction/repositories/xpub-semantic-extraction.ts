/* eslint-disable @typescript-eslint/camelcase */
import { SemanticExtractionRepository, SemanticExtractionDTO } from '../repositories/types';
import { KnexTableAdapter } from 'src/domain/knex-table-adapter';
import { SubmissionId } from 'src/domain/submission/types';
import { SemanticExtractionId } from '../types';

type DatabaseEntry = {
    id: SemanticExtractionId;
    manuscript_id: SubmissionId;
    updated: Date;
    created_by: string;
    field_name: string;
    value: string;
};

export default class XpubSemanticExtractionRepository implements SemanticExtractionRepository {
    private readonly TABLE_NAME = 'semantic_extraction';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async create(dtoSemanticExtraction: SemanticExtractionDTO): Promise<SemanticExtractionDTO> {
        const entryToSave = this.dtoToEntry({ ...dtoSemanticExtraction, updated: new Date() });
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME);
        await this._query.executor<DatabaseEntry[]>(query);
        return this.entryToDTO(entryToSave);
    }

    private dtoToEntry(dto: SemanticExtractionDTO): DatabaseEntry {
        const { submissionId, fieldName, ...rest } = dto;
        return {
            ...rest,
            manuscript_id: submissionId,
            field_name: fieldName,
        } as DatabaseEntry;
    }

    private entryToDTO(record: DatabaseEntry): SemanticExtractionDTO {
        const { manuscript_id, created_by, field_name, ...rest } = record;
        return {
            ...rest,
            submissionId: manuscript_id,
            createdBy: created_by,
            fieldName: field_name,
        } as SemanticExtractionDTO;
    }
}
