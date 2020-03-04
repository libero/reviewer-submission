/* eslint-disable @typescript-eslint/camelcase */
import { TeamRepository, TeamDTO } from './types';
import { TeamId } from '../types';
import { KnexTableAdapter } from '../../knex-table-adapter';

type DatabaseEntry = {
    id: TeamId;
    updated: Date;
};

export default class XpubTeamRepository implements TeamRepository {
    private readonly TABLE_NAME = 'team';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async findByObjectIdAndRole(object_id: string, role: string): Promise<TeamDTO[]> {
        const query = this._query
            .builder()
            .select<DatabaseEntry[]>('id', 'updated')
            .from(this.TABLE_NAME)
            .where({ object_id, role });
        return await this._query.executor<TeamDTO[]>(query);
    }

    public async findTeamById(id: TeamId): Promise<TeamDTO | null> {
        const query = this._query
            .builder()
            .select<DatabaseEntry[]>('id', 'updated')
            .from(this.TABLE_NAME)
            .where({ id });
        const [team = null] = await this._query.executor<TeamDTO[]>(query);
        return team;
    }

    public async update(dtoTeam: TeamDTO): Promise<TeamDTO> {
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

    public async create(dtoTeam: Omit<TeamDTO, 'id' | 'created' | 'updated'>): Promise<TeamDTO> {
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
}
