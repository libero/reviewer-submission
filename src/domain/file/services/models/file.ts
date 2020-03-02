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

    public setTypeToSource(): void {
        if (this.type === FileType.SUPPORTING_FILE) {
            throw new Error('Cannot set to source');
        }

        if (this.type === FileType.MANUSCRIPT_SOURCE_PENDING) {
            this.type = FileType.MANUSCRIPT_SOURCE;
        }
    }

    public setStatusToUploaded(): void {
        if (this.type === FileStatus.CREATED) {
            this.type = FileStatus.UPLOADED;
        }
    }

    public setStatusToStored(): void {
        if (this.type === FileStatus.CREATED || FileStatus.UPLOADED) {
            this.type = FileStatus.STORED;
        }
    }

    public setStatusToCancelled(): void {
        this.type = FileStatus.CANCELLED;
    }
}
