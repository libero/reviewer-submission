import { uuidType } from 'typesafe-uuid';

export enum FileStatus {
    CREATED = 'CREATED',
    UPLOADED = 'UPLOADED',
    STORED = 'STORED',
    CANCELLED = 'CANCELLED',
}

export enum FileType {
    MANUSCRIPT_SOURCE_PENDING = 'MANUSCRIPT_SOURCE_PENDING',
    MANUSCRIPT_SOURCE = 'MANUSCRIPT_SOURCE',
    SUPPORTING_FILE = 'SUPPORTING_FILE',
}

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
