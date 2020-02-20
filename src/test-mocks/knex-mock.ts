import Knex = require('knex');
import { KnexTableAdapter } from '../knex-table-adapter';

export interface MockConnector {
    getQueryBuilder(): Knex.QueryBuilder;
}

export const createMockAdapter = (mock: MockConnector): KnexTableAdapter => {
    return {
        async executor<T>(query: Knex.QueryBuilder): Promise<T> {
            return (await query) as T;
        },
        builder(): Knex.QueryBuilder {
            return mock.getQueryBuilder();
        },
    };
};
