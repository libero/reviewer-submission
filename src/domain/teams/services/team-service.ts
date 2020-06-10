import * as Knex from 'knex';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubTeamRepository from '../repositories/xpub-team';
import Team from './models/team';
import { v4 as uuid } from 'uuid';
import { TeamId } from '../types';
import { AuthorTeamMember, EditorTeamMember, EditorReviewerTeamMember } from '../repositories/types';
import { EditorDetails, AuthorDetails } from '../../submission/types';

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

    async findTeams(id: string): Promise<Array<Team>> {
        const results = await this.teamRepository.findByObjectId(id);
        return results;
    }

    async update(team: Team): Promise<Team> {
        return await this.teamRepository.update(team);
    }

    async addOrUpdateEditorTeams(submissionId: string, details: EditorDetails): Promise<Array<Team>> {
        const teams = await this.findTeams(submissionId);
        const results: Array<Team> = [];

        const suggestedSeniorEditors: Array<EditorTeamMember> = (!!details.suggestedSeniorEditors
            ? details.suggestedSeniorEditors
            : []
        )?.map(
            (elifePersonId): EditorTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const opposedSeniorEditors: Array<EditorTeamMember> = (!!details.opposedSeniorEditors
            ? details.opposedSeniorEditors
            : []
        )?.map(
            (elifePersonId): EditorTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const suggestedReviewingEditors: Array<EditorTeamMember> = (!!details.suggestedReviewingEditors
            ? details.suggestedReviewingEditors
            : []
        )?.map(
            (elifePersonId): EditorTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const opposedReviewingEditors: Array<EditorTeamMember> = (!!details.opposedReviewingEditors
            ? details.opposedReviewingEditors
            : []
        )?.map(
            (elifePersonId): EditorTeamMember => ({
                meta: { elifePersonId },
            }),
        );

        const opposedReviewers: Array<EditorReviewerTeamMember> = (!!details.opposedReviewers
            ? details.opposedReviewers
            : []
        )?.map(
            ({ email, name }): EditorReviewerTeamMember => ({
                meta: {
                    email,
                    name,
                },
            }),
        );

        const suggestedReviewers: Array<EditorReviewerTeamMember> = (!!details.suggestedReviewers
            ? details.suggestedReviewers
            : []
        )?.map(
            ({ email, name }): EditorReviewerTeamMember => ({
                meta: {
                    email,
                    name,
                },
            }),
        );

        const teamUpdates = [
            { role: 'suggestedSeniorEditor', teamMembers: suggestedSeniorEditors },
            { role: 'opposedSeniorEditor', teamMembers: opposedSeniorEditors },
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
                const newTeam = await this.createTeamByRole(role, teamMembers, submissionId, 'manuscript');
                results.push(newTeam);
            }
        });

        await Promise.all(teamUpdates);

        return results;
    }

    async updateOrCreateAuthor(submissionId: string, details: AuthorDetails): Promise<Team> {
        const team = await this.find(submissionId.toString(), 'author');
        const teamMembers: Array<AuthorTeamMember> = [
            {
                alias: details,
                meta: { corresponding: true },
            },
        ];
        let author: Team;
        if (team) {
            author = await this.update({
                ...team,
                teamMembers,
            });
        } else {
            author = await this.createAuthor(teamMembers, submissionId);
        }
        return author;
    }

    private async createTeamByRole(
        role: string,
        teamMembers: Array<EditorTeamMember | EditorReviewerTeamMember>,
        objectId: string,
        objectType: string,
    ): Promise<Team> {
        const id = TeamId.fromUuid(uuid());
        const team = new Team(id, new Date(), new Date(), teamMembers, role, objectId, objectType);
        return await this.teamRepository.create(team);
    }

    private async createAuthor(teamMembers: Array<AuthorTeamMember>, objectId: string): Promise<Team> {
        const role = 'author';
        const objectType = 'manuscript';
        const id = TeamId.fromUuid(uuid());

        const team = new Team(id, new Date(), new Date(), teamMembers, role, objectId, objectType);
        return await this.teamRepository.create(team);
    }
}
