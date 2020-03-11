import { FileId, FileType, FileStatus } from '../../types';
import { SubmissionId } from '../../../submission/types';
import { FileDTO } from '../../repositories/types';

export default class File {
    id: FileId;
    submissionId: SubmissionId;
    created?: Date;
    updated?: Date;
    type: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    status: string;

    constructor({ id, submissionId, created, updated, type, filename, url, mimeType, size, status }: FileDTO) {
        this.id = id;
        this.submissionId = submissionId;
        this.created = created;
        this.updated = updated;
        this.type = type;
        this.filename = filename;
        this.url = url;
        this.mimeType = mimeType;
        this.size = size;
        this.status = status;
    }

    public isCancelled(): boolean {
        return this.status === FileStatus.CANCELLED;
    }

    public isDeleted(): unknown {
        return this.status === FileStatus.DELETED;
    }

    public setTypeToSource(): void {
        if (this.type === FileType.SUPPORTING_FILE) {
            throw new Error('Cannot set to source');
        }

        if (this.type === FileType.MANUSCRIPT_SOURCE_PENDING) {
            this.type = FileType.MANUSCRIPT_SOURCE;
        }
    }

    public setStatusToUploaded(): void {
        if (this.status === FileStatus.CREATED) {
            this.status = FileStatus.UPLOADED;
        }
    }

    public setStatusToStored(): void {
        if (this.status === FileStatus.CREATED || FileStatus.UPLOADED) {
            this.status = FileStatus.STORED;
        }
    }

    public setStatusToCancelled(): void {
        this.status = FileStatus.CANCELLED;
    }
}
