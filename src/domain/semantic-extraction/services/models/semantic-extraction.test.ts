import SemanticExtraction from './semantic-extraction';
import { SemanticExtractionId } from '../../types';
import { SubmissionId } from '../../../submission/types';

describe('SemanticExtraction', () => {
    it('can create a SemanticExtraction object', () => {
        const dt = new Date();
        const seObject = new SemanticExtraction(
            SemanticExtractionId.fromUuid('f51afd5a-9120-4395-a290-33e076f908f4'),
            SubmissionId.fromUuid('3a7db93d-ee04-4129-bf29-f45c72d0d313'),
            dt,
            'field',
            'value',
        );
        expect(seObject).toEqual({
            fieldName: 'field',
            id: 'f51afd5a-9120-4395-a290-33e076f908f4',
            submissionId: '3a7db93d-ee04-4129-bf29-f45c72d0d313',
            value: 'value',
            created: dt,
            updated: dt,
        });
    });
});
