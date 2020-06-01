import { uuidType } from 'typesafe-uuid';

export enum FileStatus {
    CREATED = 'CREATED',
    STORED = 'STORED',
    CANCELLED = 'CANCELLED',
    DELETED = 'DELETED',
}

export enum FileType {
    MANUSCRIPT_SOURCE_PENDING = 'MANUSCRIPT_SOURCE_PENDING',
    MANUSCRIPT_SOURCE = 'MANUSCRIPT_SOURCE',
    SUPPORTING_FILE = 'SUPPORTING_FILE',
}

export class FileId extends uuidType<'FileId'>() {}
