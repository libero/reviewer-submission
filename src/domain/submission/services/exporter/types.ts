import Submission from '../models/submission';

export interface SubmissionExporter {
    export(submission: Submission, ip: string): Promise<Buffer>;
}
