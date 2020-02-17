import * as Knex from 'knex';
import { InfraLogger as logger } from '../../logger';
import { TeamRepository, Person, Team, TeamId } from '../team';

export class KnexTeamRepository implements TeamRepository {
    create(role: string, people: Person, objectId: string, objectType: string): Promise<Team | null> {
        throw new Error('Method not implemented.');
    }
    findById(id: TeamId): Promise<Team | null> {
        throw new Error('Method not implemented.');
    }
    update(team: Team): Promise<Team | null> {
        throw new Error('Method not implemented.');
    }
    private readonly TABLE_NAME = 'team';

    public constructor(private readonly knex: Knex<{}, unknown[]>) {}

    close(): void {
        logger.log(`Closing KnexSubmissionRepository.`);
        this.knex.destroy();
    }
}

/*
    select * from team where object_id='ec1c7153-ecee-4000-a010-e36b85a71b3a' and role='author';

                      id                  |          created           |          updated           |                                                                                 team_members                                                                  |  role  |              object_id               | object_type
--------------------------------------+----------------------------+----------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------+--------------------------------------+-------------
 e8299353-6b84-4719-8442-28570f39f479 | 2019-02-11 07:54:08.076+00 | 2019-02-11 08:55:15.681+00 | {"{\"meta\": {\"corresponding\": true}, \"alias\": {\"aff\": \"This University\", \"email\": \"blak@here.com\", \"lastName\": \"Foo\", \"firstName\": \"Bar\"}}"} | author | ec1c7153-ecee-4000-a010-e36b85a71b3a | manuscript

    */
/*
const dataAccess = {
  async selectById(id) {
    const rows = await runQuery(
      buildQuery
        .select()
        .from('team')
        .where({ id }),
    )
    if (!rows.length) {
      throw new Error('Team not found')
    }
    return rowToEntity(rows[0])
  },

  async selectAll() {
    const rows = await runQuery(buildQuery.select().from('team'))
    return rows.map(rowToEntity)
  },

  async insert(team) {
    const row = entityToRow(team, columnNames)
    row.id = uuid.v4()
    const query = buildQuery.insert(row).into('team')
    await runQuery(query)
    return row.id
  },

  update(team) {
    const row = entityToRow(team, columnNames)
    const query = buildQuery
      .update(row)
      .table('team')
      .where('id', team.id)
    return runQuery(query)
  },

  delete(id) {
    return runQuery(
      buildQuery
        .delete()
        .from('team')
        .where({ id }),
    )
  },
}

*/
