import * as Knex from 'knex';

export type KnexTableAdapter = {
    executor<T>(query: Knex.QueryBuilder): Promise<T>;
    builder(): Knex.QueryBuilder;
};

export const createKnexAdapter = (knex: Knex<{}, unknown[]>, schemaName: string): KnexTableAdapter => {
    return {
        async executor<T>(query: Knex.QueryBuilder): Promise<T> {
            return (await query) as T;
        },
        builder(): Knex.QueryBuilder {
            return knex.withSchema(schemaName);
        },
    };
};
