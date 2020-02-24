import { MockKnex, createMockAdapter } from '../../test-mocks/knex-mock';
import { v4 } from 'uuid';
import { TeamId } from '../types';
import XpubTeamRepository from './xpub-team';
import { KnexTableAdapter } from 'src/domain/knex-table-adapter';
import { AuthorTeamMember } from './types';

const entryId1 = TeamId.fromUuid(v4());
const entryId2 = TeamId.fromUuid(v4());

const databaseEntries = [
    {
        id: entryId1,
        updated: new Date('2020-02-18T15:14:53.155Z'),
    },
    {
        id: entryId2,
        updated: new Date('2020-02-18T15:14:53.155Z'),
    },
];

describe('Knex Submission Repository', () => {
    let adapter: KnexTableAdapter;
    let mock: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mock = new MockKnex();
        adapter = createMockAdapter(mock);
    });

    describe('findByObjectId', () => {
        it('returns the correct number of entries', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubTeamRepository(adapter);
            const result = await repo.findByObjectIdAndRole('someObjectId', 'role');
            expect(result).toHaveLength(2);
        });

        it('returns a correct DTO object from the database entries', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubTeamRepository(adapter);
            const result = await repo.findByObjectIdAndRole('someObjectId', 'role');
            expect(result[0]).toStrictEqual({
                id: entryId1,
                updated: new Date('2020-02-18T15:14:53.155Z'),
            });
            expect(result[1]).toStrictEqual({
                id: entryId2,
                updated: new Date('2020-02-18T15:14:53.155Z'),
            });
        });
        it('calls the knex instance methods with the correct parameters', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubTeamRepository(adapter);
            await repo.findByObjectIdAndRole('someObjectId', 'role');
            expect(mock.select).toBeCalledWith('id', 'updated');
            expect(mock.from).toBeCalledWith('team');
            // eslint-disable-next-line @typescript-eslint/camelcase
            expect(mock.where).toBeCalledWith({ object_id: 'someObjectId', role: 'role' });
        });
        it('returns an empty array if there are no found team entries', async (): Promise<void> => {
            adapter.executor = jest.fn().mockReturnValue([]);
            const repo = new XpubTeamRepository(adapter);
            const result = await repo.findByObjectIdAndRole('someObjectId', 'role');
            expect(result).toHaveLength(0);
        });
    });

    describe('create', () => {
        it('should create a new Team using the passed in variables and pass that to knex', async () => {
            adapter.executor = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubTeamRepository(adapter);
            const entity = {
                id: entryId1,
                role: 'role',
                objectId: '1234',
                objectType: 'type',
                teamMembers: [
                    {
                        alias: {
                            firstName: 'John',
                            lastName: 'Smith',
                            email: 'john.smith@example.com',
                            aff: 'aff',
                        },
                        meta: { corresponding: true },
                    },
                ] as Array<AuthorTeamMember>,
            };
            await repo.create(entity);
            expect(mock.insert).toBeCalledWith(
                expect.objectContaining({
                    id: entity.id,
                }),
            );
        });
    });
});
