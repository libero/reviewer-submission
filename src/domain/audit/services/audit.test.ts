import { v4 } from 'uuid';
import { AuditService } from './audit';
import { DtoAuditLog, AuditAction, UserId, ObjectId, AuditId } from '../types';

describe('Audit Service', () => {
    it('should add a log item', () => {
        const repo = {
            putLog: jest.fn(),
        };
        const controller = new AuditService(repo);
        const timestamp = new Date();
        const userId = v4();

        const item: DtoAuditLog = {
            id: AuditId.fromUuid(v4()),
            userId: UserId.fromUuid(userId),
            action: AuditAction.LOGGED_IN,
            value: 'authorized',
            objectType: 'User',
            objectId: ObjectId.fromUuid(userId),
            created: timestamp,
            updated: timestamp,
        };

        controller.recordAudit(item);
        expect(repo.putLog).toHaveBeenCalledTimes(1);
        expect(repo.putLog).toHaveBeenCalledWith(item);
    });
});
