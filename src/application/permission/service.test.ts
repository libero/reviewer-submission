import { v4 } from 'uuid';
import { SubmissionOperation, PermissionService } from './service';
import Submission, { ArticleType } from '../../domain/submission/services/models/submission';
import { User } from '../../domain/user/user';
import { SubmissionId } from '../../domain/submission/types';

describe('userCan', () => {
    let permission: PermissionService;
    let user: User;
    let submission: Submission;

    beforeEach(() => {
        permission = new PermissionService();
        user = { id: 'Bob-001', name: 'Bob', role: 'ham & cheese' };
        submission = new Submission({
            id: SubmissionId.fromUuid(v4()),
            updated: new Date().toISOString(),
            articleType: ArticleType.RESEARCH_ADVANCE,
            status: 'CREATED',
            createdBy: 'user-id',
        });
        submission.status = 'INITIAL';
    });

    describe('SubmissionOperation.UPDATE', () => {
        describe('Single submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.UPDATE;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return true if created by user', () => {
                const op = SubmissionOperation.UPDATE;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return false if not created by user', () => {
                const op = SubmissionOperation.UPDATE;
                user.role = 'user';
                user.id = 'not created by me';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(false);
            });

            it('should return false if not staff and already submitted', () => {
                const op = SubmissionOperation.UPDATE;
                user.role = 'user';
                user.id = 'user-id';
                const subClone = { ...submission };
                subClone.status = 'MECA_EXPORT_PENDING';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return true if staff and already submitted', () => {
                const op = SubmissionOperation.UPDATE;
                user.role = 'staff';
                user.id = 'user-id';
                const subClone = { ...submission };
                subClone.status = 'MECA_EXPORT_PENDING';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });
        });
        describe('Any submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.UPDATE;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCan(user, op)).toBe(true);
            });

            it('should return false for any user', () => {
                const op = SubmissionOperation.UPDATE;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCan(user, op)).toBe(false);
            });
        });
    });

    describe('SubmissionOperation.READ', () => {
        describe('Single submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.READ;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return true if created by user', () => {
                const op = SubmissionOperation.READ;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return false if not created by user', () => {
                const op = SubmissionOperation.READ;
                user.role = 'user';
                user.id = 'not created by me';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(false);
            });
        });
        describe('Any submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.READ;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCan(user, op)).toBe(true);
            });

            it('should return false for any user', () => {
                const op = SubmissionOperation.READ;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCan(user, op)).toBe(false);
            });
        });
    });

    describe('SubmissionOperation.DELETE', () => {
        describe('Single submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.DELETE;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return true if created by user', () => {
                const op = SubmissionOperation.DELETE;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return false if not created by user', () => {
                const op = SubmissionOperation.DELETE;
                user.role = 'user';
                user.id = 'not created by me';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(false);
            });
        });
        describe('Any submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.DELETE;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCan(user, op)).toBe(true);
            });

            it('should return false for any user', () => {
                const op = SubmissionOperation.DELETE;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCan(user, op)).toBe(false);
            });
        });
    });

    describe('SubmissionOperation.CREATE', () => {
        describe('Single submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.CREATE;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return true if created by user', () => {
                const op = SubmissionOperation.CREATE;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });

            it('should return true if not created by user', () => {
                const op = SubmissionOperation.CREATE;
                user.role = 'user';
                user.id = 'not created by me';
                expect(permission.userCanWithSubmission(user, op, submission)).toBe(true);
            });
        });
        describe('Any submission', () => {
            it('should return true if staff', () => {
                const op = SubmissionOperation.CREATE;
                user.role = 'staff';
                user.id = 'not important';
                expect(permission.userCan(user, op)).toBe(true);
            });

            it('should return true for any user', () => {
                const op = SubmissionOperation.CREATE;
                user.role = 'user';
                user.id = 'user-id';
                expect(permission.userCan(user, op)).toBe(true);
            });
        });
    });
});
