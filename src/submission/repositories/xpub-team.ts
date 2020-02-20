/* eslint-disable @typescript-eslint/camelcase */
import * as Knex from 'knex';
import { TeamRepository, TeamDTO } from './types';
import { InfraLogger as logger } from '../../logger';
import { TeamId } from '../types';

type DatabaseEntry = {
    id: TeamId;
    updated: Date;
};

export default class XpubTeamRepository implements TeamRepository {
    private readonly TABLE_NAME = 'team';

    public constructor(private readonly knex: Knex<{}, unknown[]>) {}

    close(): void {
        logger.log(`Closing XpubSubmissionRootRepository.`);
        this.knex.destroy();
    }

    public async findByObjectId(object_id: string): Promise<TeamDTO[]> {
        return this.knex
            .withSchema('public')
            .select<DatabaseEntry[]>('id', 'updated')
            .from(this.TABLE_NAME)
            .where({ object_id });
    }
}
