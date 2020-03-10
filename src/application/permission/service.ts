import Submission from 'src/domain/submission/services/models/submission';
import { User } from 'src/domain/user/user';

export enum SubmissionOperation {
    CREATE = 'Create Submission',
    READ = 'Read Submission',
    UPDATE = 'Update Submission',
    DELETE = 'Delete Submission',
}

export class PermissionService {
    isStaff(user: User): boolean {
        return user.role == 'staff';
    }

    userCan(user: User, operation: SubmissionOperation, submission: Submission | null): boolean {
        switch (operation) {
            case SubmissionOperation.CREATE:
                return true;
            case SubmissionOperation.READ:
            case SubmissionOperation.UPDATE:
            case SubmissionOperation.DELETE:
                return this.isStaff(user) || (submission !== null && submission.createdBy === user.id);
            default:
                return false;
        }
    }
}
