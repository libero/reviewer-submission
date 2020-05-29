/* eslint-disable @typescript-eslint/camelcase */
import { KnexAuditRepository } from './audit';
import { DtoAuditLog, AuditId, UserId, ObjectId, AuditAction } from '../types';
import { createMockAdapter, MockKnex } from '../../test-mocks/knex-mock';
import { KnexTableAdapter } from '../../knex-table-adapter';

describe('KnexAuditRepository', () => {
    let adapter: KnexTableAdapter;
    let mock: MockKnex;
    const mockDate = new Date();
    const mockAuditItem: DtoAuditLog = {
        id: AuditId.fromUuid('f3572ce7-c670-4b1b-8b89-a05ff1b40df4'),
        created: mockDate,
        userId: UserId.fromUuid('b1ef7433-060e-44df-a4a8-30287b15a8ec'),
        objectId: ObjectId.fromUuid('6467826e-a276-4cda-b6d8-c6a6a9217ee0'),
        objectType: 'type',
        updated: mockDate,
        value: 'value',
        action: AuditAction.DELETED,
    };
    const expectedValues = {
        id: AuditId.fromUuid('f3572ce7-c670-4b1b-8b89-a05ff1b40df4'),
        created: mockDate,
        user_id: UserId.fromUuid('b1ef7433-060e-44df-a4a8-30287b15a8ec'),
        object_id: ObjectId.fromUuid('6467826e-a276-4cda-b6d8-c6a6a9217ee0'),
        object_type: 'type',
        updated: mockDate,
        value: 'value',
        action: AuditAction.DELETED,
    };
    beforeEach(() => {
        jest.resetAllMocks();
        mock = new MockKnex();
        adapter = createMockAdapter(mock);
    });

    describe('putLog', (): void => {
        it('inserts to audit table using knex', async (): Promise<void> => {
            const Audit = new KnexAuditRepository(adapter);
            await Audit.putLog(mockAuditItem);
            expect(mock.into).toBeCalledWith('audit_log');
        });

        it('inserts audit item passed using knex', async (): Promise<void> => {
            const Audit = new KnexAuditRepository(adapter);
            await Audit.putLog(mockAuditItem);
            expect(mock.insert).toBeCalledWith(expectedValues);
        });

        it('returns true on completion', async (): Promise<void> => {
            const Audit = new KnexAuditRepository(adapter);
            const returnValue = await Audit.putLog(mockAuditItem);
            expect(returnValue).toBe(true);
        });
    });
});
