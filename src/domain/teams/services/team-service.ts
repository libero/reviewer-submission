import * as Knex from 'knex';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubTeamRepository from '../repositories/xpub-team';
import Team from './models/team';
import { v4 as uuid } from 'uuid';
import { TeamId } from '../types';
import { AuthorTeamMember, PeopleTeamMember } from '../repositories/types';

export class TeamService {
    teamRepository: XpubTeamRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.teamRepository = new XpubTeamRepository(adapter);
    }

    async find(id: string, role: string): Promise<Team | null> {
        const results = await this.teamRepository.findByObjectIdAndRole(id, role);
        return results.length > 0 ? results[0] : null;
    }

    async findPeopleTeams(id: string): Promise<Array<Team>> {
        const results = await this.teamRepository.findByObjectId(id);
        return results;
    }

    async update(team: Team): Promise<Team> {
        return await this.teamRepository.update(team);
    }

    /*  For creating the following roles of teams
        opposedReviewer
        suggestedSeniorEditor
        opposedSeniorEditor
        opposedReviewingEditor
        suggestedReviewingEditor
        suggestedReviewer
    */
    async createTeamByRole(
        role: string,
        teamMembers: Array<PeopleTeamMember>,
        objectId: string,
        objectType: string,
    ): Promise<Team> {
        const id = TeamId.fromUuid(uuid());
        const team = new Team(id, new Date(), new Date(), teamMembers, role, objectId, objectType);
        return await this.teamRepository.create(team);
    }

    async createAuthor(
        role: string,
        teamMembers: Array<AuthorTeamMember>,
        objectId: string,
        objectType: string,
    ): Promise<Team> {
        const id = TeamId.fromUuid(uuid());
        const team = new Team(id, new Date(), new Date(), teamMembers, role, objectId, objectType);
        return await this.teamRepository.create(team);
    }
}
