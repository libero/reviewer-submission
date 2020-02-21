import { SubmissionService } from '../../domain/submission';
import { Author, SubmissionId } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';

export class WizardService {
    constructor(private readonly submissionService: SubmissionService) {}

    async saveDetailsPage(id: SubmissionId, details: Author): Promise<Submission | null> {
        return null;
    }
}
