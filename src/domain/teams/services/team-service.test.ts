import Knex from 'knex';
import { TeamService } from './team-service';
import XpubTeamRepository from '../repositories/xpub-team';
import Team from './models/team';

describe('Teams Service', () => {
    let service: TeamService;
    const emptyTeam: Team[] = [];
    const nullTeam: Team = (null as unknown) as Team;

    beforeEach(() => {
        service = new TeamService((null as unknown) as Knex);
    });
    describe('finding', () => {
        it('can find by id, role - not found', async () => {
            const findByObjectIdAndRole = jest.fn().mockResolvedValue(emptyTeam);
            XpubTeamRepository.prototype.findByObjectIdAndRole = findByObjectIdAndRole;

            const result = await service.find('x', 'role');

            expect(result).toBeNull();
            expect(findByObjectIdAndRole).toHaveBeenCalledTimes(1);
            expect(findByObjectIdAndRole).toHaveBeenCalledWith('x', 'role');
        });

        it('can find by id, role - found', async () => {
            const findByObjectIdAndRole = jest.fn().mockResolvedValue(['chicken']);
            XpubTeamRepository.prototype.findByObjectIdAndRole = findByObjectIdAndRole;

            const result = await service.find('x', 'role');

            expect(result).toBe('chicken');
            expect(findByObjectIdAndRole).toHaveBeenCalledTimes(1);
            expect(findByObjectIdAndRole).toHaveBeenCalledWith('x', 'role');
        });

        it('can find by id - not found', async () => {
            const findByObjectId = jest.fn().mockResolvedValue(emptyTeam);
            XpubTeamRepository.prototype.findByObjectId = findByObjectId;

            const result = await service.findTeams('x');

            expect(result).toStrictEqual([]);
            expect(findByObjectId).toHaveBeenCalledTimes(1);
            expect(findByObjectId).toHaveBeenCalledWith('x');
        });

        it('can find by id - found', async () => {
            const findByObjectId = jest.fn().mockResolvedValue(['chicken']);
            XpubTeamRepository.prototype.findByObjectId = findByObjectId;

            const result = await service.findTeams('x');

            expect(result).toStrictEqual(['chicken']);
            expect(findByObjectId).toHaveBeenCalledTimes(1);
            expect(findByObjectId).toHaveBeenCalledWith('x');
        });
    });

    describe('updating', () => {
        it('updates', async () => {
            const update = jest.fn().mockResolvedValue(['mighty-ducks']);
            XpubTeamRepository.prototype.update = update;

            const result = await service.update(nullTeam);

            expect(result).toStrictEqual(['mighty-ducks']);
            expect(update).toHaveBeenCalledTimes(1);
            expect(update).toHaveBeenCalledWith(nullTeam);
        });
        it('addOrUpdateEditorTeams', async () => {
            const findByObjectId = jest.fn().mockResolvedValue(['mighty-ducks']);
            const create = jest.fn();
            XpubTeamRepository.prototype.findByObjectId = findByObjectId;
            XpubTeamRepository.prototype.create = create;
            const ed = {
                opposedReviewingEditors: ['87f34696'],
                suggestedReviewingEditors: ['6fabd619', 'fd8295ba'],
                suggestedSeniorEditors: ['1e9e661f', '3edb2ed8'],
                opposedSeniorEditors: ['232d9893'],
                suggestedReviewers: [
                    {
                        name: 'J. Edward Reviewer',
                        email: 'edward@example.com',
                    },
                    {
                        name: 'Frances de Reviewer',
                        email: 'frances@example.org',
                    },
                    {
                        name: 'Gertrude Reviewer',
                        email: 'gertrude@example.net',
                    },
                ],
                opposedReviewers: [
                    {
                        name: 'Hoo',
                        email: 'laughing@example.com',
                    },
                    {
                        name: 'Who',
                        email: 'singing@example.com',
                    },
                ],
                opposedSeniorEditorsReason: 'From another galaxy',
                opposedReviewingEditorsReason: 'Not any more',
                opposedReviewersReason: 'Wandering days are over',
            };

            const result = await service.addOrUpdateEditorTeams('abcdefg', ed);
            expect(typeof result).toBe('object');
            expect(result).toHaveLength(6);
            expect(create).toHaveBeenCalledTimes(6);
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: 'abcdefg',
                    objectType: 'manuscript',
                    teamMembers: [{ meta: { elifePersonId: '1e9e661f' } }, { meta: { elifePersonId: '3edb2ed8' } }],
                    role: 'suggestedSeniorEditor',
                }),
            );
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: 'abcdefg',
                    teamMembers: [{ meta: { elifePersonId: '232d9893' } }],
                    role: 'opposedSeniorEditor',
                }),
            );
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: 'abcdefg',
                    objectType: 'manuscript',
                    teamMembers: [{ meta: { elifePersonId: '6fabd619' } }, { meta: { elifePersonId: 'fd8295ba' } }],
                    role: 'suggestedReviewingEditor',
                }),
            );
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: 'abcdefg',
                    objectType: 'manuscript',
                    teamMembers: [{ meta: { elifePersonId: '87f34696' } }],
                    role: 'opposedReviewingEditor',
                }),
            );
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: 'abcdefg',
                    objectType: 'manuscript',
                    teamMembers: [
                        {
                            meta: {
                                name: 'J. Edward Reviewer',
                                email: 'edward@example.com',
                            },
                        },
                        {
                            meta: {
                                name: 'Frances de Reviewer',
                                email: 'frances@example.org',
                            },
                        },
                        {
                            meta: {
                                name: 'Gertrude Reviewer',
                                email: 'gertrude@example.net',
                            },
                        },
                    ],
                    role: 'suggestedReviewer',
                }),
            );
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectId: 'abcdefg',
                    objectType: 'manuscript',
                    teamMembers: [
                        {
                            meta: {
                                name: 'Hoo',
                                email: 'laughing@example.com',
                            },
                        },
                        {
                            meta: {
                                name: 'Who',
                                email: 'singing@example.com',
                            },
                        },
                    ],
                    role: 'opposedReviewer',
                }),
            );
        });
    });

    describe('creating', () => {
        it('updateOrCreateAuthor - not pre-existing', async () => {
            const create = jest.fn().mockResolvedValue('donkey');
            const findByObjectIdAndRole = jest.fn().mockResolvedValue([]);
            XpubTeamRepository.prototype.create = create;
            XpubTeamRepository.prototype.findByObjectIdAndRole = findByObjectIdAndRole;

            const result = await service.updateOrCreateAuthor('123456', {
                firstName: 'Liz',
                lastName: 'Windsor',
                email: 'liz@buckingham.com',
                institution: 'Royalty',
            });

            expect(result).toStrictEqual('donkey');
            expect(create).toHaveBeenCalledTimes(1);
            expect(findByObjectIdAndRole).toHaveBeenCalledTimes(1);
            expect(create).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectType: 'manuscript',
                    role: 'author',
                    teamMembers: [
                        {
                            alias: {
                                institution: 'Royalty',
                                email: 'liz@buckingham.com',
                                firstName: 'Liz',
                                lastName: 'Windsor',
                            },
                            meta: { corresponding: true },
                        },
                    ],
                }),
            );
        });
        it('updateOrCreateAuthor - pre-existing', async () => {
            const update = jest.fn().mockResolvedValue('donkey');
            const findByObjectIdAndRole = jest.fn().mockResolvedValue([
                {
                    objectType: 'manuscript',
                    role: 'author',
                    teamMembers: [
                        {
                            alias: {
                                institution: 'Royalty',
                                email: 'charles@buckingham.com',
                                firstName: 'Charles',
                                lastName: 'Windsor',
                            },
                            meta: { corresponding: true },
                        },
                    ],
                },
            ]);
            XpubTeamRepository.prototype.update = update;
            XpubTeamRepository.prototype.findByObjectIdAndRole = findByObjectIdAndRole;

            const result = await service.updateOrCreateAuthor('123456', {
                firstName: 'Liz',
                lastName: 'Windsor',
                email: 'liz@buckingham.com',
                institution: 'Royalty',
            });

            expect(result).toStrictEqual('donkey');
            expect(update).toHaveBeenCalledTimes(1);
            expect(findByObjectIdAndRole).toHaveBeenCalledTimes(1);
            expect(update).toHaveBeenCalledWith(
                expect.objectContaining({
                    objectType: 'manuscript',
                    role: 'author',
                    teamMembers: [
                        {
                            alias: {
                                institution: 'Royalty',
                                email: 'liz@buckingham.com',
                                firstName: 'Liz',
                                lastName: 'Windsor',
                            },
                            meta: { corresponding: true },
                        },
                    ],
                }),
            );
        });
    });
});
