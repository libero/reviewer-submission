import { createKnexAdapter } from '../../knex-table-adapter';
import { DtoAuditLog } from '../types';
import { KnexAuditRepository } from '../repositories/audit';
import Knex from 'knex';

export class AuditService {
    auditRepo: KnexAuditRepository;

    public constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.auditRepo = new KnexAuditRepository(adapter);
    }

    public async recordAudit(item: DtoAuditLog): Promise<boolean> {
        return this.auditRepo.putLog(item);
    }
}
