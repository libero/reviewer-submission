/* eslint-disable @typescript-eslint/camelcase */
import { TeamRepository, TeamDTO } from './types';
import { TeamId } from '../types';
import { KnexTableAdapter } from 'src/domain/knex-table-adapter';

type DatabaseEntry = {
    id: TeamId;
    updated: Date;
};

export default class XpubTeamRepository implements TeamRepository {
    private readonly TABLE_NAME = 'team';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async findByObjectId(object_id: string): Promise<TeamDTO[]> {
        const query = this._query
            .builder()
            .select<DatabaseEntry[]>('id', 'updated')
            .from(this.TABLE_NAME)
            .where({ object_id });

        return this._query.executor<TeamDTO[]>(query);
    }

    public async update(dtoTeam: Partial<TeamDTO> & { id: TeamId }): Promise<TeamDTO> {
        // @todo: do we merge against remote state?
        const team = await this.findByObjectId(dtoTeam.id.value);
        if (team === null) {
            throw new Error(`Unable to find entry with id: ${dtoTeam.id}`);
        }

        const entryToSave = { ...team, ...dtoTeam, updated: new Date() };
        const query = this._query
            .builder()
            .update(entryToSave)
            .into(this.TABLE_NAME);
        return this._query.executor<TeamDTO>(query);
    }

    public async create(dtoSubmission: Omit<TeamDTO, 'updated'>): Promise<TeamDTO> {
        const entryToSave = { ...dtoSubmission, updated: new Date() };
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME);
        return this._query.executor<TeamDTO>(query);
    }
}
