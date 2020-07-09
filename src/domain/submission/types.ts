import { uuidType } from 'typesafe-uuid';
import File from '../file/services/models/file';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export type AuthorDetails = {
    firstName: string;
    lastName: string;
    email: string;
    institution: string;
};

export type ManuscriptDetails = {
    title?: string;
    subjects?: string[];
    previouslyDiscussed?: string;
    previouslySubmitted?: string;
    cosubmission?: string[];
};

export type DisclosureDetails = {
    submitterSignature?: string;
    disclosureConsent?: boolean;
};

export type ReviewerAlias = {
    name: string;
    email: string;
};

export type OpposedReviewer = {
    name: string;
    email: string;
};

export type EditorDetails = {
    suggestedSeniorEditors?: Array<string>;
    opposedSeniorEditors?: Array<string>;
    opposedSeniorEditorsReason?: string;
    suggestedReviewingEditors?: Array<string>;
    opposedReviewingEditors?: Array<string>;
    opposedReviewingEditorsReason?: string;
    suggestedReviewers?: Array<ReviewerAlias>;
    opposedReviewers?: Array<OpposedReviewer>;
    opposedReviewersReason?: string;
};

export type FileDetails = {
    coverLetter?: string;
    manuscriptFile?: File | null; // responsibility of the Files Service
    supportingFiles?: Array<File>; // responsibility of the Files Service
};

export enum SubmissionStatus {
    INITIAL = 'INITIAL',
    MECA_EXPORT_PENDING = 'MECA_EXPORT_PENDING',
    MECA_EXPORT_FAILED = 'MECA_EXPORT_FAILED',
    MECA_EXPORT_SUCCEEDED = 'MECA_EXPORT_SUCCEEDED',
    MECA_IMPORT_FAILED = 'MECA_IMPORT_FAILED',
    MECA_IMPORT_SUCCEEDED = 'MECA_IMPORT_SUCCEEDED',
}
