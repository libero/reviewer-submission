import { EJPNameRepository } from './types';
import EJPName from '../services/models/ejp-name';
import { KnexTableAdapter } from '../../knex-table-adapter';

type DatabaseEntry = {
    id: number;
    first: string;
    last: string;
};

export class KnexEJPNamesRepository implements EJPNameRepository {
    private readonly TABLE_NAME = 'ejp_name';
    private readonly COLUMNS = ['id', 'first', 'last'];

    public constructor(private readonly _query: KnexTableAdapter) {}

    async create(ejpName: EJPName): Promise<EJPName> {
        const record = {
            id: ejpName.id,
            first: ejpName.first,
            last: ejpName.last,
        };

        const query = this._query
            .builder()
            .insert(record)
            .into(this.TABLE_NAME);

        await this._query.executor(query);
        return ejpName;
    }

    async findByName(name: string): Promise<EJPName | null> {
        const query = this._query
            .builder()
            .select(...this.COLUMNS)
            .from(this.TABLE_NAME)
            .whereRaw("lower(first || ' ' || last) = ?", [name.toLowerCase()]);

        const record = await this._query.executor<DatabaseEntry[]>(query);
        if (record.length > 0) {
            return new EJPName(record[0].id, record[0].first, record[0].last);
        }

        return null;
    }
}
