import { uuidType } from 'typesafe-uuid';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface DtoViewSubmission {
    id: SubmissionId;
    title: string;
    updated: Date;
    articleType: string;
}
