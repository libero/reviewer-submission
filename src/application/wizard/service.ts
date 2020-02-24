import { SubmissionService } from '../../domain/submission';
import { Author, SubmissionId } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { TeamService } from 'src/domain/teams/services/team-service';

export class WizardService {
    constructor(private readonly submissionService: SubmissionService, private readonly teamService: TeamService) {}

    async saveDetailsPage(id: SubmissionId, details: Author): Promise<Submission | null> {
        // needs permissions checks
        const submission = await this.submissionService.get(id);
        const team = await this.teamService.find(id.value, 'author');
        if (team) {
            // update
            this.teamService.update();
        } else {
            // create
        }
        return submission;
    }
}
