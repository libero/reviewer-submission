/* eslint-disable @typescript-eslint/camelcase */
import { SubmissionId } from '../types';
import { SubmissionRepository } from './types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import Submission from '../services/models/submission';

type EntryMeta = {
    articleType: string;
    title?: string;
};

// this is the xpub schema type
type DatabaseEntry = {
    id: SubmissionId;
    created: Date;
    updated: Date;
    created_by: string;
    status: string;
    last_step_visited?: string;
    meta: EntryMeta;
    cover_letter?: string;
    previously_discussed?: string;
    previously_submitted?: string[];
    cosubmission?: string[];
    opposed_senior_editors_reason?: string;
    opposed_reviewing_editors_reason?: string;
    submitter_signature?: string;
    disclosure_consent?: boolean;
    opposed_reviewers_reason?: string;
};

export default class XpubSubmissionRootRepository implements SubmissionRepository {
    private readonly TABLE_NAME = 'manuscript';
    private readonly COLUMNS = ['id', 'created', 'updated', 'created_by', 'status', 'meta', 'cover_letter'];

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async findAll(): Promise<Submission[]> {
        const query = this._query
            .builder()
            .select(...this.COLUMNS)
            .from(this.TABLE_NAME);
        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.map(this.entryToModel);
    }

    public async findByUserId(userId: string): Promise<Submission[]> {
        const query = this._query
            .builder()
            .select(...this.COLUMNS)
            .from(this.TABLE_NAME)
            .where({ created_by: userId });

        const result = await this._query.executor<DatabaseEntry[]>(query);
        return result.map(this.entryToModel);
    }

    public async findById(id: SubmissionId): Promise<Submission | null> {
        const query = this._query
            .builder()
            .select(...this.COLUMNS)
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
        const query = this._query
            .builder()
            .update(entryToSave)
            .table(this.TABLE_NAME)
            .where({ id: submission.id });
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
            created: submission.created as Date,
            updated: submission.updated as Date,
            created_by: submission.createdBy,
            status: submission.status,
            cover_letter: submission.files.coverLetter,
            meta: {
                articleType: submission.articleType,
                title: submission.manuscriptDetails.title,
            },
        };
    }

    private entryToModel(record: DatabaseEntry): Submission {
        const result = new Submission({
            id: record.id,
            created: record.created,
            updated: record.updated,
            articleType: record.meta.articleType,
            status: record.status,
            createdBy: record.created_by,
        });
        result.files.coverLetter = record.cover_letter;
        result.manuscriptDetails.title = record.meta.title;
        return result;
    }
}
