import { uuidType } from 'typesafe-uuid';

export class SubmissionId extends uuidType<'SubmissionId'>() {}

export interface Person {
    firstName: string;
    lastName: string;
    email: string;
    institution: string;
}

export type Author = {
    firstName: string;
    lastName: string;
    email: string;
    aff: string;
};

export type Details = {
    title: string;
    subjects: string[];
    previouslyDiscussed: string;
    previouslySubmitted: string[];
    cosubmission: string[];
};
