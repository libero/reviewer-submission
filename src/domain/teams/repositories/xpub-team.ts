/* eslint-disable @typescript-eslint/camelcase */
import { TeamRepository, AuthorTeamMember, PeopleTeamMember } from './types';
import { TeamId } from '../types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import Team from '../services/models/team';

type DatabaseEntry = {
    id: TeamId;
    updated: Date;
    created: Date;
    team_members: Array<AuthorTeamMember | PeopleTeamMember>;
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
            .select<DatabaseEntry[]>('id', 'updated', 'team_members')
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
            .select<DatabaseEntry[]>('id', 'updated', 'team_members')
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
        const {
            teamMembers: team_members,
            objectId: object_id,
            objectType: object_type,
            id,
            updated,
            created,
            role,
        } = team;
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
            team_members: teamMembers,
            object_id: objectId,
            object_type: objectType,
            id,
            updated,
            created,
            role,
        } = databaseEntry;

        return new Team(id, created, updated, teamMembers, role, objectId, objectType);
    }
}
