import { SubmissionId, SubmissionStatus } from '../../domain/submission/types';
import Submission, { ArticleType } from '../../domain/submission/services/models/submission';
import { PermissionService, SubmissionOperation } from '../permission/service';
import { User } from '../../domain/user/user';
import { SubmissionService } from '../../domain/submission';

export class DashboardService {
    constructor(
        private readonly permissionService: PermissionService,
        private readonly submissionService: SubmissionService,
    ) {}

    async findMySubmissions(user: User): Promise<Array<Submission>> {
        // we don't need to check permissions to perform this operation.
        const submissions = await this.submissionService.findByUserId(user.id);
        return submissions.map(submission => {
            if (submission.status) {
                switch (submission.status) {
                    case SubmissionStatus.INITIAL:
                        submission.status = 'CONTINUE_SUBMISSION';
                        break;
                    case SubmissionStatus.MECA_EXPORT_PENDING:
                    case SubmissionStatus.MECA_EXPORT_FAILED:
                    case SubmissionStatus.MECA_EXPORT_SUCCEEDED:
                    case SubmissionStatus.MECA_IMPORT_FAILED:
                    case SubmissionStatus.MECA_IMPORT_SUCCEEDED:
                        submission.status = 'SUBMITTED';
                        break;
                    default:
                        submission.status = 'CONTINUE_SUBMISSION';
                        break;
                }
            }
            return submission;
        });
    }

    async startSubmission(user: User, articleType: string): Promise<Submission> {
        const allowed = this.permissionService.userCan(user, SubmissionOperation.CREATE);
        if (!allowed) {
            throw new Error('User not allowed to create submission');
        }

        const submission = await this.submissionService.create(articleType, user.id);
        if (submission.status) {
            switch (submission.status) {
                case SubmissionStatus.INITIAL:
                    submission.status = 'CONTINUE_SUBMISSION';
                    break;
                case SubmissionStatus.MECA_EXPORT_PENDING:
                case SubmissionStatus.MECA_EXPORT_FAILED:
                case SubmissionStatus.MECA_EXPORT_SUCCEEDED:
                case SubmissionStatus.MECA_IMPORT_FAILED:
                case SubmissionStatus.MECA_IMPORT_SUCCEEDED:
                    submission.status = 'SUBMITTED';
                    break;
                default:
                    submission.status = 'CONTINUE_SUBMISSION';
                    break;
            }
        }
        return submission;
    }

    async saveArticleType(user: User, submissionId: SubmissionId, articleType: ArticleType): Promise<Submission> {
        let submission = await this.submissionService.get(submissionId);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.UPDATE, submission);
        if (submission === null) {
            throw new Error('No submission found');
        }
        if (!allowed) {
            throw new Error('User not allowed to submit');
        }
        submission = await this.submissionService.saveArticleType(submission, articleType);

        return submission;
    }

    async getSubmission(user: User, id: SubmissionId): Promise<Submission> {
        const submission = await this.submissionService.get(id);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.READ, submission);
        if (!allowed) {
            throw new Error('User not allowed to read submission');
        }
        return submission;
    }

    async deleteSubmission(user: User, id: SubmissionId): Promise<boolean> {
        const submission = await this.submissionService.get(id);
        const allowed = this.permissionService.userCanWithSubmission(user, SubmissionOperation.DELETE, submission);
        if (!allowed) {
            throw new Error('User not allowed to delete submission');
        }
        return this.submissionService.delete(user, id);
    }
}
