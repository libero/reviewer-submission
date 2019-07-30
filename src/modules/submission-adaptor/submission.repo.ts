// This should probably be called something else
import { SubmissionRepository, ISubmission } from '../../packages/submission/submission.repository';
import { Option, None } from 'funfix';
import * as Knex from 'knex';

export class KnexSubmissionRepository implements SubmissionRepository {
  private readonly TABLE_NAME = 'submission';

  public constructor(private readonly knex: Knex<{}, unknown[]>) {
  }

  public async initSchema() {
    // TODO: Add a method for handling when the table does/doesn't exist
    // as this will error if the table already exists
    // XXX: Maybe move this to migrations
    return await this.knex.schema.createTable(
      this.TABLE_NAME,
      (table: Knex.CreateTableBuilder) => {
        table.uuid('id');
        table.string('title');
        table.timestamp('updated').defaultTo(this.knex.fn.now());
      },
    );
  }

  public async findAll(): Promise<ISubmission[]> {
    const stuff = await this.knex(this.TABLE_NAME).select<ISubmission[]>('id', 'title', 'updated');

    const dated = stuff.map(s => ({...s, updated: new Date(s.updated)}));
    return dated;
  }

  public async findById(id: string): Promise<Option<ISubmission>> {
    const rows = await this.knex(this.TABLE_NAME).where({id}).select('id', 'title', 'updated');

    return Option.of(rows[0]);
  }

  public async save(subm: ISubmission): Promise<ISubmission> {
    await this.knex(this.TABLE_NAME).insert({...subm, updated: new Date().toISOString()});

    return subm;
  }

}
