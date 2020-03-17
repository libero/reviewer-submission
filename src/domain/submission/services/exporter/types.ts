import { SubmissionId } from '../../types';

export interface SubmissionExporter {
    export(id: SubmissionId): Promise<Buffer>;
}
