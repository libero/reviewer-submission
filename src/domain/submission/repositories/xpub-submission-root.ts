/* eslint-disable @typescript-eslint/camelcase */
import { SubmissionId, ManuscriptDetails } from '../types';
import { SubmissionRepository } from './types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import Submission from '../services/models/submission';

type EntryMeta = {
    articleType: string;
    title?: string;
    subjects?: string[];
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
    private readonly COLUMNS = [
        'id',
        'created',
        'updated',
        'created_by',
        'status',
        'meta',
        'cover_letter',
        'previously_discussed',
        'previously_submitted',
        'cosubmission',
        'opposed_senior_editors_reason',
        'opposed_reviewing_editors_reason',
        'opposed_reviewers_reason',
        'last_step_visited',
        'submitter_signature',
        'disclosure_consent',
    ];

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
            .where({ created_by: userId })
            .orderBy('updated', 'desc');

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
        submission.updated = new Date().toISOString();
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
        submission.updated = new Date().toISOString();
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
        const previouslySubmitted = submission.manuscriptDetails.previouslySubmitted;
        return {
            id: submission.id,
            created: new Date(submission.created),
            updated: new Date(submission.updated),
            created_by: submission.createdBy,
            status: submission.status,
            last_step_visited: submission.lastStepVisited,
            cover_letter: submission.files.coverLetter,
            previously_discussed: submission.manuscriptDetails.previouslyDiscussed,
            previously_submitted: previouslySubmitted ? [previouslySubmitted] : undefined,
            cosubmission: submission.manuscriptDetails.cosubmission,
            opposed_senior_editors_reason: submission.editorDetails.opposedSeniorEditorsReason,
            opposed_reviewing_editors_reason: submission.editorDetails.opposedReviewingEditorsReason,
            opposed_reviewers_reason: submission.editorDetails.opposedReviewersReason,
            meta: {
                articleType: submission.articleType,
                title: submission.manuscriptDetails.title,
                subjects: submission.manuscriptDetails.subjects,
            },
            disclosure_consent: submission.disclosure.disclosureConsent ?? undefined,
            submitter_signature: submission.disclosure.submitterSignature ?? undefined,
        };
    }

    private entryToModel(record: DatabaseEntry): Submission {
        const result = new Submission({
            id: record.id,
            created: record.created.toISOString(),
            updated: record.updated.toISOString(),
            articleType: record.meta.articleType,
            status: record.status,
            createdBy: record.created_by,
        });
        const meta = record.meta;
        result.lastStepVisited = record.last_step_visited;
        const details: ManuscriptDetails = {
            title: meta.title,
            subjects: meta.subjects,
            previouslyDiscussed: record.previously_discussed,
            previouslySubmitted: record.previously_submitted ? record.previously_submitted[0] : undefined,
            cosubmission: record.cosubmission,
        };
        result.files.coverLetter = record.cover_letter;
        result.manuscriptDetails = details;
        if (record.opposed_reviewers_reason) {
            result.editorDetails.opposedReviewersReason = record.opposed_reviewers_reason;
        }
        if (record.opposed_reviewing_editors_reason) {
            result.editorDetails.opposedReviewingEditorsReason = record.opposed_reviewing_editors_reason;
        }
        if (record.opposed_senior_editors_reason) {
            result.editorDetails.opposedSeniorEditorsReason = record.opposed_senior_editors_reason;
        }
        result.disclosure.disclosureConsent = record.disclosure_consent;
        result.disclosure.submitterSignature = record.submitter_signature;

        return result;
    }
}
