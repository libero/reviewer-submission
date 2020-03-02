import { SubmissionService } from '../../domain/submission';
import { Author, SubmissionId } from '../../domain/submission/types';
import Submission from '../../domain/submission/services/models/submission';
import { TeamService } from 'src/domain/teams/services/team-service';
import { AuthorTeamMember } from 'src/domain/teams/repositories/types';
import { PermissionService, SubmissionOperation } from '../permission/service';
import { User } from 'src/domain/user/user';

export class WizardService {
    constructor(
        private readonly submissionService: SubmissionService,
        private readonly teamService: TeamService,
        private readonly permissionService: PermissionService,
    ) {}

    async saveDetailsPage(user: User, id: SubmissionId, details: Author): Promise<Submission | null> {
        const submission = await this.submissionService.get(id);
        if (submission === null) {
            throw new Error('No submission found');
        }
        const allowed = this.permissionService.userCan(user, SubmissionOperation.UPDATE, submission);
        if (!allowed) {
            throw new Error('User not allowed to save submission');
        }
        const team = await this.teamService.find(id.value, 'author');
        const teamMembers: Array<AuthorTeamMember> = [
            {
                alias: details,
                meta: { corresponding: true },
            },
        ];
        if (team) {
            this.teamService.update({
                ...team,
                teamMembers,
            });
        } else {
            this.teamService.create({
                role: 'author',
                teamMembers,
                objectId: id.value,
                objectType: 'manuscript',
            });
        }
        return submission;
    }
}
