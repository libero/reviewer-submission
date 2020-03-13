import { FileId, FileType, FileStatus } from '../../types';
import { SubmissionId } from '../../../submission/types';
import { FileDTO } from '../../repositories/types';

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

    constructor(
        id: FileId,
        submissionId: SubmissionId,
        created: Date,
        updated: Date,
        type: FileType,
        filename: string,
        mimeType: string,
        size: number,
        status: string,
    ) {
        this.id = id;
        this.submissionId = submissionId;
        this.created = created;
        this.updated = updated;
        this.type = type;
        this.filename = filename;
        this.url = this.getFileS3Key(type, submissionId, id);
        this.mimeType = mimeType;
        this.size = size;
        this.status = status;
    }

    public static fromDTO(fileDTO: FileDTO): File {
        return new File(
            fileDTO.id,
            fileDTO.submissionId,
            fileDTO.created || new Date(),
            fileDTO.updated || new Date(),
            fileDTO.type as FileType,
            fileDTO.filename,
            fileDTO.mimeType,
            fileDTO.size,
            fileDTO.status,
        );
    }

    public toDTO(): FileDTO {
        return this;
    }

    private getFileS3Key(fileType: FileType, submissionId: SubmissionId, fileId: FileId): string {
        switch (fileType) {
            case FileType.MANUSCRIPT_SOURCE:
                return `manuscripts/${submissionId}/${fileId}`;
            case FileType.SUPPORTING_FILE:
                return `supporting/${submissionId}/${fileId}`;
            default:
                throw new Error('Invalid FileType');
        }
    }

    public static makeManuscriptFile(
        id: FileId,
        submissionId: SubmissionId,
        filename: string,
        mimeType: string,
        size: number,
    ): File {
        return new File(
            id,
            submissionId,
            new Date(),
            new Date(),
            FileType.MANUSCRIPT_SOURCE,
            filename,
            mimeType,
            size,
            FileStatus.CREATED,
        );
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
