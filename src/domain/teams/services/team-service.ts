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

    // TODO: implement this
    find(id: string, role: string): Promise<TeamDTO | null> {
        return null;
    }
}
