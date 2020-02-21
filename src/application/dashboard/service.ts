import { SubmissionId } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { SubmissionService } from 'src/domain/submission';

export class DashboardService {
    constructor(private readonly submissionService: SubmissionService) {}

    async find(): Promise<Submission[]> {
        // do some security and validation here
        return this.submissionService.findAll();
    }

    async startSubmission(articleType: string, userId: string): Promise<Submission> {
        // do some security and validation here
        return this.submissionService.create(articleType, userId);
    }

    async getSubmission(id: SubmissionId): Promise<Submission> {
        // do some security and validation here
        return this.submissionService.get(id);
    }

    async deleteSubmission(id: SubmissionId): Promise<boolean> {
        // do some security and validation here
        return this.submissionService.delete(id);
    }
}
