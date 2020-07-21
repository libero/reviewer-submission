import Submission from '../../domain/submission/services/models/submission';
import { User } from '../../domain/user/user';
import { SubmissionStatus } from '../../domain/submission/types';

export enum SubmissionOperation {
    CREATE = 'Create Submission',
    READ = 'Read Submission',
    UPDATE = 'Update Submission',
    DELETE = 'Delete Submission',
}

export class PermissionService {
    isStaff(user: User): boolean {
        return user.role === 'staff';
    }

    userCan(user: User, operation: SubmissionOperation): boolean {
        switch (operation) {
            case SubmissionOperation.CREATE:
                return true;
            case SubmissionOperation.READ:
            case SubmissionOperation.UPDATE:
            case SubmissionOperation.DELETE:
                return this.isStaff(user);
            default:
                return false;
        }
    }

    userCanWithSubmission(user: User, operation: SubmissionOperation, submission: Submission): boolean {
        switch (operation) {
            case SubmissionOperation.CREATE:
                return true;
            case SubmissionOperation.READ:
            case SubmissionOperation.UPDATE:
            case SubmissionOperation.DELETE:
                return (
                    this.isStaff(user) ||
                    (submission.status === SubmissionStatus.INITIAL && submission.createdBy === user.id)
                );
            default:
                return false;
        }
    }
}
