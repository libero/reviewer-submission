/* eslint-disable @typescript-eslint/camelcase */
import { TeamRepository, AuthorTeamMember } from './types';
import { TeamId } from '../types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import Team from '../services/models/team';

type DatabaseEntry = {
    id: TeamId;
    updated: Date;
    created: Date;
    team_members: Array<AuthorTeamMember>;
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
            .select<DatabaseEntry[]>('id', 'updated', 'alias')
            .from(this.TABLE_NAME)
            .where({ object_id, role });
        const results = await this._query.executor<Team[]>(query);
        // results.map(_ => new );
    }

    public async findTeamById(id: TeamId): Promise<Team | null> {
        const query = this._query
            .builder()
            .select<DatabaseEntry[]>('id', 'updated')
            .from(this.TABLE_NAME)
            .where({ id });
        const [team = null] = await this._query.executor<Team[]>(query);
        return team;
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
            .update(entryToSave)
            .where({ id: dtoTeam.id });
        await this._query.executor(query);
        return entryToSave;
    }

    public async create(dtoTeam: Omit<Team, 'id' | 'created' | 'updated'>): Promise<Team> {
        const entryToSave = { ...dtoTeam, updated: new Date() };
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME)
            .returning('id');
        const id = await this._query.executor<TeamId>(query);

        if (id === null) {
            throw new Error('Unable to create team');
        }

        const team = await this.findTeamById(id);

        if (team === null) {
            throw new Error(`Unable to find entry with id: ${id}`);
        }

        return team;
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
}
