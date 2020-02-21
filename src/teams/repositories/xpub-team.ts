/* eslint-disable @typescript-eslint/camelcase */
import * as Knex from 'knex';
import { TeamRepository, TeamDTO } from '../../submission/repositories/types';
import { InfraLogger as logger } from '../../logger';
import { TeamId } from '../../submission/types';

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

    public async update(dtoTeam: Partial<TeamDTO> & { id: TeamId }): Promise<TeamDTO> {
        // @todo: do we merge against remote state?
        const team = await this.findByObjectId(dtoTeam.id.value);
        if (team === null) {
            throw new Error(`Unable to find entry with id: ${dtoTeam.id}`);
        } else {
            const entryToSave = { ...team, ...dtoTeam, updated: new Date() };
            return this.knex
                .withSchema('public')
                .update(entryToSave)
                .into(this.TABLE_NAME);
        }
    }

    public async create(dtoSubmission: Omit<TeamDTO, 'updated'>): Promise<TeamDTO> {
        const entryToSave = { ...dtoSubmission, updated: new Date() };
        return this.knex
            .withSchema('public')
            .insert(entryToSave)
            .into(this.TABLE_NAME);
    }
}
