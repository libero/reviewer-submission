import { SubmissionService } from '../submission-service';
import { SubmissionId } from '../../types';
import Submission from '../models/submission';

export class MecaImportCallback {
    constructor(private readonly submissionService: SubmissionService) {}

    validateResponse(response: string): boolean {
        return response === 'success' || response === 'failure';
    }
    storeResult(id: string, response: string) {
        console.log('store result');
    }
}
