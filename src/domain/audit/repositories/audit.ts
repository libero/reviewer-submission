/* eslint-disable @typescript-eslint/camelcase */
import { KnexTableAdapter } from '../../knex-table-adapter';
import { AuditRepository, DtoAuditLog } from '../types';
import { InfraLogger as logger } from '../../../logger';

export class KnexAuditRepository implements AuditRepository {
    private readonly TABLE_NAME = 'audit_log';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async putLog(item: DtoAuditLog): Promise<boolean> {
        logger.debug(`Auditing ${JSON.stringify(item)}`);
        const record = {
            id: item.id,
            created: item.created,
            user_id: item.userId,
            object_id: item.objectId,
            object_type: item.objectType,
            updated: item.updated,
            value: item.value,
            action: item.action,
        };
        const query = this._query
            .builder()
            .insert(record)
            .into(this.TABLE_NAME);

        await this._query.executor(query);

        logger.debug('auditWritten', item);
        return true;
    }
}
