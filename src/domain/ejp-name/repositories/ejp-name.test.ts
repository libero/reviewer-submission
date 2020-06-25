/* eslint-disable @typescript-eslint/camelcase */
import { createMockAdapter, MockKnex } from '../../test-mocks/knex-mock';
import { KnexTableAdapter } from '../../knex-table-adapter';
import { KnexEJPNamesRepository } from './ejp-name';
import EJPName from '../services/models/ejp-name';

describe('XpubFileRepository', () => {
    let adapter: KnexTableAdapter;
    let mock: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mock = new MockKnex();
        adapter = createMockAdapter(mock);
    });

    describe('create', (): void => {
        it('inserts into ejp_name table using knex', async (): Promise<void> => {
            const repo = new KnexEJPNamesRepository(adapter);
            const ejpName = { id: 1, first: 'John', last: 'Smith' };
            const result = await repo.create(ejpName);
            expect(mock.into).toBeCalledWith('ejp_name');
            expect(mock.insert).toBeCalledWith(ejpName);
            expect(result).toStrictEqual(ejpName);
        });
    });

    describe('findByName', () => {
        it('returns null when no name exists', async () => {
            const repo = new KnexEJPNamesRepository(adapter);
            const result = await repo.findByName('Jon Smith');
            expect(mock.select).toHaveBeenCalled();
            expect(mock.from).toBeCalledWith('ejp_name');
            expect(mock.whereRaw).toHaveBeenCalledTimes(1);
            expect(result).toBeNull();
        });

        it('returns a File when found', async () => {
            const repo = new KnexEJPNamesRepository(adapter);
            const ejpName = new EJPName(1, 'John', 'Smith');
            adapter.executor = jest.fn().mockReturnValue([ejpName]);

            const result = await repo.findByName('John Smith');
            expect(mock.select).toHaveBeenCalled();
            expect(mock.from).toBeCalledWith('ejp_name');
            expect(mock.whereRaw).toHaveBeenCalledTimes(1);
            expect(adapter.executor).toHaveBeenCalled();
            expect(result).not.toBeNull();
            expect(result).toStrictEqual(ejpName);
        });
    });
});
