import { SemanticExtractionId } from '../../types';
import { SubmissionId } from '../../../submission/types';

export default class SemanticExtraction {
    id: SemanticExtractionId;
    updated?: Date;
    created?: Date;
    submissionId: SubmissionId;
    fieldName: string;
    value: string;

    public constructor(
        id: SemanticExtractionId,
        submissionId: SubmissionId,
        created: Date,
        fieldName: string,
        value: string,
    ) {
        this.id = id;
        this.submissionId = submissionId;
        this.created = created;
        this.updated = created;
        this.fieldName = fieldName;
        this.value = value;
    }
}
