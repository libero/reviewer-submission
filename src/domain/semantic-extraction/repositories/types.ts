import { SubmissionId } from '../../submission/types';
import { SemanticExtractionId } from '../types';

export interface SemanticExtractionRepository {
    create(dtoSemanticExtraction: SemanticExtractionDTO): Promise<SemanticExtractionDTO>;
}

export type SemanticExtractionDTO = {
    id: SemanticExtractionId;
    updated?: Date;
    created?: Date;
    submissionId: SubmissionId;
    fieldName: string;
    value: string;
};
