import { uuidType } from 'typesafe-uuid';

// Status:
// 'CREATED',
// 'UPLOADED',
// 'STORED',
// 'CANCELLED'

export class FileId extends uuidType<'FileId'>() {}

export interface File {
    id: FileId;
    submissionId: string;
    created: Date;
    updated: Date;
    type: string;
    label: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    status: string;
}

