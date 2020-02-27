import { FileId } from '../../types';
import { SubmissionId } from '../../../submission/types';
import { FileDTO } from '../../repositories/types';

export default class File {
    id: FileId;
    submissionId: SubmissionId;
    created: Date;
    updated: Date;
    type: string;
    label: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    status: string;

    constructor({ id, submissionId, created, updated, type, label, filename, url, mimeType, size, status }: FileDTO) {
        this.id = id;
        this.submissionId = submissionId;
        this.created = created;
        this.updated = updated;
        this.type = type;
        this.label = label;
        this.filename = filename;
        this.url = url;
        this.mimeType = mimeType;
        this.size = size;
        this.status = status;
    }
}
