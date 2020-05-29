import { v4 } from 'uuid';
import { AuditService } from './audit';
import { DtoAuditLog, UserId, ObjectId, AuditId, AuditAction } from '../types';
import Knex from 'knex';
import { KnexAuditRepository } from '../repositories/audit';

jest.mock('knex');

describe('Audit Service', () => {
    it('calling recordAudit should call putLog in the repo', async () => {
        const service = new AuditService((null as unknown) as Knex);
        const timestamp = new Date();
        const userId = v4();

        const item: DtoAuditLog = {
            id: AuditId.fromUuid(v4()),
            userId: UserId.fromUuid(userId),
            action: AuditAction.CREATED,
            value: 'authorized',
            objectType: 'User',
            objectId: ObjectId.fromUuid(userId),
            created: timestamp,
            updated: timestamp,
        };
        KnexAuditRepository.prototype.putLog = jest.fn().mockReturnValue(true);

        const result = await service.recordAudit(item);
        expect(result).toBe(true);
    });
});
