import { createKnexAdapter, KnexTableAdapter } from '../knex-table-adapter';
import Knex = require('knex');

export class MockKnex {
    insert(): MockKnex {
        return this;
    }
    withSchema(): MockKnex {
        return this;
    }
    into(): MockKnex {
        return this;
    }
    select(): MockKnex {
        return this;
    }
    from(): MockKnex {
        return this;
    }
    where(): MockKnex {
        return this;
    }
    returning(): MockKnex {
        return this;
    }
    delete(): boolean {
        return true;
    }
    update(): MockKnex {
        return this;
    }
}

export function createMockAdapter(): KnexTableAdapter {
    return createKnexAdapter((new MockKnex() as unknown) as Knex<{}, unknown[]>, '');
}
