import { FileId, FileType, FileStatus } from '../../types';
import { SubmissionId } from '../../../submission/types';

export default class File {
    id: FileId;
    submissionId: SubmissionId;
    created?: Date;
    updated?: Date;
    type: FileType;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    status: string;
    downloadLink?: string;

    constructor({
        id,
        submissionId,
        created,
        updated,
        type,
        filename,
        mimeType,
        size,
        status,
    }: {
        id: FileId;
        submissionId: SubmissionId;
        created?: Date;
        updated?: Date;
        type: FileType;
        filename: string;
        mimeType: string;
        size: number;
        status: string;
    }) {
        this.id = id;
        this.submissionId = submissionId;
        this.created = created;
        this.updated = updated;
        this.type = type;
        this.filename = filename;
        this.url = this.generateS3Key(type, submissionId, id);
        this.mimeType = mimeType;
        this.size = size;
        this.status = status;
    }

    private generateS3Key(fileType: FileType, submissionId: SubmissionId, fileId: FileId): string {
        switch (fileType) {
            case FileType.MANUSCRIPT_SOURCE:
                return `manuscripts/${submissionId}/${fileId}`;
            case FileType.SUPPORTING_FILE:
                return `supporting/${submissionId}/${fileId}`;
            default:
                throw new Error('Invalid FileType');
        }
    }

    public isCancelled(): boolean {
        return this.status === FileStatus.CANCELLED;
    }

    public isDeleted(): unknown {
        return this.status === FileStatus.DELETED;
    }
}
