import { uuidType } from 'typesafe-uuid';
import File from '../file/services/models/file';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface Person {
    firstName: string;
    lastName: string;
    email: string;
    institution: string;
}

export type AuthorDetails = {
    firstName: string;
    lastName: string;
    email: string;
    aff: string;
};

export type ManuscriptDetails = {
    title?: string;
    subjects?: string[];
    previouslyDiscussed?: string;
    previouslySubmitted?: string[];
    cosubmission?: string[];
};

export type DisclosureDetails = {
    submitterSignature?: string;
    disclosureConsent?: boolean;
};

export type EditorsDetails = {
    opposedSeniorEditorsReason?: string;
    opposedReviewingEditorsReason?: string;
    opposedReviewersReason?: string;
};

export type FileDetails = {
    coverLetter?: string;
    manuscriptFile?: File | null; // responsibility of the Files Service
    supportingFiles?: Array<File>; // responsibility of the Files Service
};
