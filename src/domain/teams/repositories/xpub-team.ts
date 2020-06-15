/* eslint-disable @typescript-eslint/camelcase */
import { TeamRepository, AuthorTeamMember, EditorTeamMember, EditorReviewerTeamMember } from './types';
import { TeamId } from '../types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import Team from '../services/models/team';

type DatabaseAuthorDetails = {
    firstName: string;
    lastName: string;
    email: string;
    aff: string;
};

type DatabaseAuthorTeamMember = {
    alias: DatabaseAuthorDetails;
    meta: { corresponding: true };
};

type DatabaseTeamMembers = Array<DatabaseAuthorTeamMember | EditorTeamMember | EditorReviewerTeamMember>;

type DatabaseEntry = {
    id: TeamId;
    updated: Date;
    created: Date;
    team_members: DatabaseTeamMembers;
    role: string;
    object_id: string;
    object_type: string;
};

export default class XpubTeamRepository implements TeamRepository {
    private readonly TABLE_NAME = 'team';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async findByObjectIdAndRole(object_id: string, role: string): Promise<Team[]> {
        const query = this._query
            .builder()
            .select<DatabaseEntry[]>('id', 'updated', 'team_members', 'role')
            .from(this.TABLE_NAME)
            .where({ object_id, role });
        const results = await this._query.executor<DatabaseEntry[]>(query);
        return results.map(r => this.toModel(r));
    }

    public async findByObjectId(object_id: string): Promise<Team[]> {
        const query = this._query
            .builder()
            .select<DatabaseEntry[]>('id', 'updated', 'team_members', 'role')
            .from(this.TABLE_NAME)
            .where({ object_id });
        const results = await this._query.executor<DatabaseEntry[]>(query);
        return results.map(r => this.toModel(r));
    }

    public async findTeamById(id: TeamId): Promise<Team | null> {
        const query = this._query
            .builder()
            .select<DatabaseEntry[]>('id', 'updated', 'team_members', 'role')
            .from(this.TABLE_NAME)
            .where({ id });
        const [team = null] = await this._query.executor<DatabaseEntry[]>(query);
        return team ? this.toModel(team) : null;
    }

    public async update(dtoTeam: Team): Promise<Team> {
        const team = await this.findTeamById(dtoTeam.id);
        if (team === null) {
            throw new Error(`Unable to find entry with id: ${dtoTeam.id}`);
        }
        const entryToSave = { ...team, ...dtoTeam, updated: new Date() };
        const query = this._query
            .builder()
            .table(this.TABLE_NAME)
            .update(this.toDatabaseEntry(entryToSave))
            .where({ id: dtoTeam.id });
        await this._query.executor(query);
        return entryToSave;
    }

    public async create(inputTeam: Team): Promise<Team> {
        const entryToSave = { ...inputTeam, updated: new Date() };
        const query = this._query
            .builder()
            .insert(this.toDatabaseEntry(entryToSave))
            .into(this.TABLE_NAME);
        await this._query.executor<TeamId>(query);
        return inputTeam;
    }

    private toDatabaseEntry(team: Team): DatabaseEntry {
        const { teamMembers, objectId: object_id, objectType: object_type, id, updated, created, role } = team;

        // we need to convert AuthorTeamMember to DatabaseAuthorTeamMember since we are storing the 'institution'
        // field as 'aff' in the database which is inherited from xpub.
        const team_members = (team.role === 'author'
            ? teamMembers.map(teamMember => {
                  const { institution: aff, ...rest } = (teamMember as AuthorTeamMember).alias;
                  return { ...teamMember, alias: { aff, ...rest } };
              })
            : teamMembers) as DatabaseTeamMembers;

        const databaseEntry: DatabaseEntry = {
            team_members,
            object_id,
            object_type,
            id,
            updated,
            created,
            role,
        };
        return databaseEntry;
    }

    private toModel(databaseEntry: DatabaseEntry): Team {
        const {
            team_members,
            object_id: objectId,
            object_type: objectType,
            id,
            updated,
            created,
            role,
        } = databaseEntry;

        // we need to convert back from DatabaseAuthorTeamMember to AuthorTeamMember since we are storing the 'institution'
        // field as 'aff' in the database which is inherited from xpub.
        const teamMembers = (role === 'author'
            ? team_members.map(teamMember => {
                  const { aff: institution, ...rest } = (teamMember as DatabaseAuthorTeamMember).alias;
                  return { ...teamMember, alias: { institution, ...rest } };
              })
            : team_members) as Array<AuthorTeamMember | EditorTeamMember | EditorReviewerTeamMember>;

        return new Team(id, created, updated, teamMembers, role, objectId, objectType);
    }
}
