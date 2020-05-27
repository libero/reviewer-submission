import { KnexAuditRepository } from './audit';
import * as Knex from 'knex';
import { DtoAuditLog } from '../types';

describe('KnexAuditRepository', (): void => {
    describe('putLog', (): void => {
        it('inserts to audit table using knex', async (): Promise<void> => {
            const mockKnex = (jest.fn(() => ({
                insert: jest.fn(),
            })) as unknown) as Knex;
            const mockAuditItem = ({} as unknown) as DtoAuditLog;
            const Audit = new KnexAuditRepository(mockKnex);
            await Audit.putLog(mockAuditItem);
            expect(mockKnex).toBeCalledWith('audit_log');
        });
        it('inserts audit item passed using knex', async (): Promise<void> => {
            const mockInsert = jest.fn();
            const mockKnex = (jest.fn(() => ({
                insert: mockInsert,
            })) as unknown) as Knex;
            const mockAuditItem = ({} as unknown) as DtoAuditLog;
            const Audit = new KnexAuditRepository(mockKnex);
            await Audit.putLog(mockAuditItem);
            expect(mockInsert).toBeCalledWith(mockAuditItem);
        });

        it('returns true on completion', async (): Promise<void> => {
            const mockKnex = (jest.fn(() => ({
                insert: jest.fn(),
            })) as unknown) as Knex;
            const mockAuditItem = ({} as unknown) as DtoAuditLog;
            const Audit = new KnexAuditRepository(mockKnex);
            const returnValue = await Audit.putLog(mockAuditItem);
            expect(returnValue).toBe(true);
        });
    });
});
