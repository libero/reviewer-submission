import * as Knex from 'knex';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubTeamRepository from '../repositories/xpub-team';
import { TeamDTO } from '../repositories/types';

export class TeamService {
    teamRepository: XpubTeamRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.teamRepository = new XpubTeamRepository(adapter);
    }

    async find(id: string, role: string): Promise<TeamDTO | null> {
        const results = await this.teamRepository.findByObjectIdAndRole(id, role);
        return results.length > 0 ? results[0] : null;
    }

    async update(team: TeamDTO): Promise<TeamDTO> {
        return await this.teamRepository.update(team);
    }

    async create(team: Omit<TeamDTO, 'id' | 'created' | 'updated'>): Promise<TeamDTO> {
        return await this.teamRepository.create(team);
    }
}
