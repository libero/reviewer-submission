import { createKnexAdapter, KnexTableAdapter } from '../knex-table-adapter';
import Knex = require('knex');

export class MockKnex {
    insert = jest.fn().mockReturnValue(this);
    withSchema = jest.fn().mockReturnValue(this);
    into = jest.fn().mockReturnValue(this);
    select = jest.fn().mockReturnValue(this);
    from = jest.fn().mockReturnValue(this);
    where = jest.fn().mockReturnValue(this);
    returning = jest.fn().mockReturnValue(this);
    delete = jest.fn().mockReturnValue(this);
    update = jest.fn().mockReturnValue(this);
    table = jest.fn().mockReturnValue(this);
    whereRaw = jest.fn().mockReturnValue(this);
}

export function createMockAdapter(mock: MockKnex): KnexTableAdapter {
    return createKnexAdapter((mock as unknown) as Knex<{}, unknown[]>, 'mock-public-schema');
}
