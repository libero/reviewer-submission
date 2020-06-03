import { uuidType } from 'typesafe-uuid';

export class SemanticExtractionId extends uuidType<'SemanticExtractionId'>() {}

export type Suggestion = {
    value: string;
    fieldName: string;
};
