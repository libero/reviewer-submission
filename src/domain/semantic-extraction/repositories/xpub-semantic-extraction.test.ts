/* eslint-disable @typescript-eslint/camelcase */
import XpubSemanticExtractionRepository from './xpub-semantic-extraction';
import { createMockAdapter, MockKnex } from '../../test-mocks/knex-mock';
import { KnexTableAdapter } from '../../knex-table-adapter';
import { SubmissionId } from '../../submission/types';
import SemanticExtraction from '../services/models/semantic-extraction';
import { SemanticExtractionId } from '../types';

describe('KnexAuditRepository', () => {
    let adapter: KnexTableAdapter;
    let mock: MockKnex;
    let repo: XpubSemanticExtractionRepository;
    const mockSubmissionId = SubmissionId.fromUuid('6467826e-a276-4cda-b6d8-c6a6a9217ee0');
    const mockSEId = SemanticExtractionId.fromUuid('8129c582-6103-4dad-8245-09c7ed6ec90b');

    beforeEach(() => {
        jest.resetAllMocks();
        mock = new MockKnex();
        adapter = createMockAdapter(mock);
        repo = new XpubSemanticExtractionRepository(adapter);
    });

    describe('getSuggestionBySubmissionId', (): void => {
        it('gets from table using knex', async (): Promise<void> => {
            await repo.getSuggestionBySubmissionId(mockSubmissionId);
            expect(mock.from).toBeCalledWith('semantic_extraction');
            expect(mock.where).toBeCalledWith({ manuscript_id: mockSubmissionId });
        });
        it('gets single value when multiples ones', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue([
                { field_name: 'field-name1', value: 'value1' },
                { field_name: 'field-name2', value: 'value2' },
            ]);
            const result = await repo.getSuggestionBySubmissionId(mockSubmissionId);
            expect(result).toStrictEqual({ fieldName: 'field-name1', value: 'value1' });
        });
        it('gets null when no values', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue([]);
            const result = await repo.getSuggestionBySubmissionId(mockSubmissionId);
            expect(result).toBeNull();
        });
    });

    describe('create', (): void => {
        it('creates into table using knex', async (): Promise<void> => {
            await repo.create(new SemanticExtraction(mockSEId, mockSubmissionId, new Date(), 'field', 'value'));
            expect(mock.into).toBeCalledWith('semantic_extraction');
            expect(mock.insert).toBeCalledTimes(1);
            expect(mock.insert.mock.calls[0][0]).toMatchObject({
                field_name: 'field',
                value: 'value',
                id: mockSEId,
                manuscript_id: mockSubmissionId,
            });
        });
        it('returns the entry', async (): Promise<void> => {
            const result = await repo.create(
                new SemanticExtraction(mockSEId, mockSubmissionId, new Date(), 'field', 'value'),
            );
            expect(result).toMatchObject({
                fieldName: 'field',
                value: 'value',
                id: mockSEId,
                submissionId: mockSubmissionId,
            });
        });
    });
});
