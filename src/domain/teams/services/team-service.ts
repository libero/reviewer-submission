import * as Knex from 'knex';

import { createKnexAdapter } from '../../knex-table-adapter';
import XpubTeamRepository from '../repositories/xpub-team';

export class TeamService {
    teamRepository: XpubTeamRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.teamRepository = new XpubTeamRepository(adapter);
    }
}
