/* eslint-disable @typescript-eslint/camelcase */
import { SubmissionId } from '../types';
import { SubmissionRepository } from './types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import Submission from '../services/models/submission';

type entryMeta = {
    articleType: string;
    title: string;
};
// this is the xpub schema type
type DatabaseEntry = {
    id: SubmissionId;
    updated: Date;
    created_by: string;
    status: string;
    meta: entryMeta;
};

export default class XpubSubmissionRootRepository implements SubmissionRepository {
    private readonly TABLE_NAME = 'manuscript';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async findAll(): Promise<Submission[]> {
        const query = this._query
            .builder()
            .select('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME);
        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.map(this.entryToModel);
    }

    public async findByUserId(userId: string): Promise<Submission[]> {
        const query = this._query
            .builder()
            .select('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME)
            .where({ created_by: userId });

        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.map(this.entryToModel);
    }

    public async findById(id: SubmissionId): Promise<Submission | null> {
        const query = this._query
            .builder()
            .select('id', 'updated', 'created_by', 'status', 'meta')
            .from(this.TABLE_NAME)
            .where({ id });
        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.length ? this.entryToModel(result[0]) : null;
    }

    public async update(submission: Submission): Promise<Submission> {
        const existingSubmission = await this.findById(submission.id);
        if (existingSubmission === null) {
            throw new Error(`Unable to find entry with id: ${submission.id}`);
        }
        submission.updated = new Date();
        const entryToSave = this.modelToEntry(submission);
        const query = this._query.builder().update(entryToSave);
        await this._query.executor<DatabaseEntry[]>(query);
        return this.entryToModel(entryToSave);
    }

    public async create(submission: Submission): Promise<Submission> {
        submission.updated = new Date();
        const entryToSave = this.modelToEntry(submission);
        const query = this._query
            .builder()
            .insert(entryToSave)
            .into(this.TABLE_NAME);
        await this._query.executor<DatabaseEntry[]>(query);
        return this.entryToModel(entryToSave);
    }

    public async delete(id: SubmissionId): Promise<boolean> {
        const query = this._query
            .builder()
            .table(this.TABLE_NAME)
            .where({ id })
            .delete();
        const result = await this._query.executor<number>(query);
        return result >= 1 ? true : false;
    }

    // These mapping functions are here because xpub schema isn't what we want the dto to look like but we need to convert data sent to something compatible with knex.insert
    private modelToEntry(submission: Submission): DatabaseEntry {
        return {
            id: submission.id,
            updated: submission.updated as Date,
            created_by: submission.createdBy,
            status: submission.status,
            meta: {
                articleType: submission.articleType,
                title: submission.title,
            },
        };
    }

    private entryToModel(record: DatabaseEntry): Submission {
        const {
            created_by: createdBy,
            meta: { title, articleType },
            ...rest
        } = record;

        return new Submission({
            ...rest,
            createdBy,
            title,
            articleType,
        });
    }
}
