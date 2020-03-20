/* eslint-disable @typescript-eslint/camelcase */
import { SemanticExtractionRepository } from '../repositories/types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import { SubmissionId } from '../../submission/types';
import { SemanticExtractionId } from '../types';
import SemanticExtraction from '../services/models/semantic-extraction';
import { Suggestion } from '../services/models/sugestion';

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

    public async getSuggestionBySubmissionId(submissionId: SubmissionId): Promise<Suggestion | null> {
        const query = this._query
            .builder()
            .select('value', 'field_name')
            .from(this.TABLE_NAME)
            .where({ manuscript_id: submissionId });
        const results = await this._query.executor<DatabaseEntry[]>(query);
        return results.length > 0 ? { value: results[0].value, fieldName: results[0].field_name } : null;
    }

    public async create(semanticExtraction: SemanticExtraction): Promise<SemanticExtraction> {
        const entryToSave = this.modelToEntry({ ...semanticExtraction, updated: new Date() });
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME);
        await this._query.executor<DatabaseEntry[]>(query);
        return this.entryToDTO(entryToSave);
    }

    private modelToEntry(SemanticExtraction: SemanticExtraction): DatabaseEntry {
        const { submissionId, fieldName, ...rest } = SemanticExtraction;
        return {
            ...rest,
            manuscript_id: submissionId,
            field_name: fieldName,
        } as DatabaseEntry;
    }

    private entryToDTO(record: DatabaseEntry): SemanticExtraction {
        const { manuscript_id, created_by, field_name, ...rest } = record;
        return {
            ...rest,
            submissionId: manuscript_id,
            createdBy: created_by,
            fieldName: field_name,
        } as SemanticExtraction;
    }
}
