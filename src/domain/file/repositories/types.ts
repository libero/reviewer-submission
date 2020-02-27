import { FileId } from '../types';
import { SubmissionId } from '../../submission/types';

export interface FileDTO {
    id: FileId;
    submissionId: SubmissionId;
    status: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    updated: Date;
    type: string;
    label?: string;
}
