import * as Knex from 'knex';
import { MockKnex } from '../../test-mocks/knex-mock';
import XpubTeamRepository from './xpub-team';
import { v4 } from 'uuid';
import { TeamId } from '../types';

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
    let mockKnex: MockKnex;

    beforeEach(() => {
        jest.resetAllMocks();
        mockKnex = new MockKnex();
        mockKnex.insert = jest.fn().mockReturnValue(mockKnex);
        mockKnex.withSchema = jest.fn().mockReturnValue(mockKnex);
        mockKnex.into = jest.fn().mockReturnValue(mockKnex);
        mockKnex.update = jest.fn().mockReturnValue(mockKnex);
        mockKnex.select = jest.fn().mockReturnValue(mockKnex);
        mockKnex.from = jest.fn().mockReturnValue(mockKnex);
        mockKnex.where = jest.fn().mockReturnValue(mockKnex);
        mockKnex.returning = jest.fn().mockReturnValue(mockKnex);
    });

    describe('findByObjectId', () => {
        it('returns the correct number of entries', async (): Promise<void> => {
            mockKnex.where = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubTeamRepository((mockKnex as unknown) as Knex);
            const result = await repo.findByObjectId('someObjectId');
            expect(result).toHaveLength(2);
        });

        it('returns a correct DTO object from the database entries', async (): Promise<void> => {
            mockKnex.where = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubTeamRepository((mockKnex as unknown) as Knex);
            const result = await repo.findByObjectId('someObjectId');
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
            mockKnex.where = jest.fn().mockReturnValue(databaseEntries);
            const repo = new XpubTeamRepository((mockKnex as unknown) as Knex);
            await repo.findByObjectId('someObjectId');
            expect(mockKnex.withSchema).toBeCalledWith('public');
            expect(mockKnex.select).toBeCalledWith('id', 'updated');
            expect(mockKnex.from).toBeCalledWith('team');
            // eslint-disable-next-line @typescript-eslint/camelcase
            expect(mockKnex.where).toBeCalledWith({ object_id: 'someObjectId' });
        });
        it('returns an empty array if there are no found team entries', async (): Promise<void> => {
            mockKnex.where = jest.fn().mockReturnValue([]);
            const repo = new XpubTeamRepository((mockKnex as unknown) as Knex);
            const result = await repo.findByObjectId('someObjectId');
            expect(result).toHaveLength(0);
        });
    });

    describe('create', () => {
        it('should create a new Team using the passed in variables and pass that to knex', async () => {
            const repo = new XpubTeamRepository((mockKnex as unknown) as Knex);
            await repo.create(databaseEntries[0]);
            expect(mockKnex.insert).toBeCalledWith(
                expect.objectContaining({
                    id: databaseEntries[0].id,
                }),
            );
        });
    });
});
