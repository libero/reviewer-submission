import * as Knex from 'knex';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubTeamRepository from '../repositories/xpub-team';
import Team from './models/team';
import { v4 as uuid } from 'uuid';
import { TeamId } from '../types';
import { AuthorTeamMember, PeopleTeamMember, PeopleReviewerTeamMember } from '../repositories/types';
import { PeopleDetails } from 'src/domain/submission/types';

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

    async addOrUpdatePeopleTeams(submissionId: string, details: PeopleDetails): Promise<Array<Team>> {
        const teams = await this.findPeopleTeams(submissionId);
        const results: Array<Team> = [];

        const suggestedSeniorEditors: Array<PeopleTeamMember> = (details.suggestedSeniorEditors || [])?.map(
            (elifePersonId): PeopleTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const opposedSeniorEditors: Array<PeopleTeamMember> = (details.opposedSeniorEditors || [])?.map(
            (elifePersonId): PeopleTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const suggestedReviewingEditors: Array<PeopleTeamMember> = (details.suggestedReviewingEditors || [])?.map(
            (elifePersonId): PeopleTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const opposedReviewingEditors: Array<PeopleTeamMember> = (details.opposedReviewingEditors || [])?.map(
            (elifePersonId): PeopleTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const opposedReviewers: Array<PeopleReviewerTeamMember> = (details.opposedReviewers || [])?.map(
            ({ email, name }): PeopleReviewerTeamMember => ({
                meta: {
                    email,
                    name,
                },
            }),
        );

        const suggestedReviewers: Array<PeopleReviewerTeamMember> = (details.suggestedReviewers || [])?.map(
            ({ email, name }): PeopleReviewerTeamMember => ({
                meta: {
                    email,
                    name,
                },
            }),
        );

        const teamUpdates = [
            { role: 'suggestedSeniorEditors', teamMembers: suggestedSeniorEditors },
            { role: 'opposedSeniorEditors', teamMembers: opposedSeniorEditors },
            { role: 'suggestedReviewingEditor', teamMembers: suggestedReviewingEditors },
            { role: 'opposedReviewingEditor', teamMembers: opposedReviewingEditors },
            { role: 'opposedReviewer', teamMembers: opposedReviewers },
            { role: 'suggestedReviewer', teamMembers: suggestedReviewers },
        ].map(async ({ role, teamMembers }) => {
            const team = teams.find(t => t.role === role);

            if (team) {
                const updatedTeam = await this.update({ ...team, teamMembers });
                results.push(updatedTeam);
            } else {
                const newTeam = await this.createTeamByRole(role, teamMembers, submissionId.toString(), 'manuscript');
                results.push(newTeam);
            }
        });

        await Promise.all(teamUpdates);

        return results;
    }

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
