import { v4 as uuid } from 'uuid';
import Submission, { ArticleType } from './submission';
import { SubmissionId, SubmissionStatus } from '../../types';
import File from '../../../file/services/models/file';
import { FileId, FileType, FileStatus } from '../../../file/types';

describe('Submission Entity', () => {
    let id: SubmissionId;
    let submission: Submission;

    const setValidSubmission = (): void => {
        submission.manuscriptDetails.title = 'Test';
        submission.manuscriptDetails.subjects = ['Test'];

        submission.editorDetails.suggestedSeniorEditors = ['123', '321'];
        submission.editorDetails.opposedSeniorEditors = ['234'];
        submission.editorDetails.opposedSeniorEditorsReason = 'reason';
        submission.editorDetails.suggestedReviewingEditors = ['567', '765'];
        submission.editorDetails.opposedReviewingEditors = ['8910'];
        submission.editorDetails.opposedReviewingEditorsReason = 'reason 2';
        submission.editorDetails.suggestedReviewers = [{ name: 'name1', email: 'name1@elifesciences.org' }];
        submission.editorDetails.opposedReviewers = [{ name: 'name2', email: 'name2@elifesciences.org' }];
        submission.editorDetails.opposedReviewersReason = 'because';

        submission.disclosure.disclosureConsent = true;
        submission.disclosure.submitterSignature = 'signature';

        submission.author = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'email@elifesciences.org',
            institution: 'int',
        };

        submission.files.coverLetter = 'Accept please!';
        submission.files.manuscriptFile = new File({
            id: FileId.fromUuid(uuid()),
            submissionId: id,
            created: new Date(),
            updated: new Date(),
            type: FileType.MANUSCRIPT_SOURCE,
            filename: 'readme',
            mimeType: 'text',
            size: 100,
            status: 'STORED',
        });
    };

    beforeEach(() => {
        id = SubmissionId.fromUuid(uuid());
        submission = new Submission({
            id: id,
            status: SubmissionStatus.INITIAL,
            createdBy: '123',
            updated: new Date().toISOString(),
            articleType: 'research-article',
        });
    });

    describe('constructor', () => {
        it('creates a new entity and correctly sets properties from constructor params', () => {
            expect(submission).toBeInstanceOf(Submission);
            expect(submission.id).toBe(id);
            expect(submission.status).toBe('INITIAL');
            expect(submission.articleType).toBe('research-article');
            expect(submission.createdBy).toBe('123');
            expect(submission.updated).toBeDefined();
            expect(submission.editorDetails).toStrictEqual({});
            expect(submission.disclosure).toStrictEqual({});
            expect(submission.manuscriptDetails).toStrictEqual({});
            expect(submission.author).toBeUndefined();
            expect(submission.suggestions).toStrictEqual([]);
        });

        it('throws if an invalid articleType is passed', () => {
            expect(() => {
                new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date().toISOString(),
                    articleType: 'foo',
                });
            }).toThrow('Invalid article type');
        });
        describe('can create all valid articleTypes', () => {
            it('research-article', () => {
                const s = new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date().toISOString(),
                    articleType: 'research-article',
                });
                expect(s.articleType).toBe(ArticleType.RESEARCH_ARTICLE);
            });
            it('feature', () => {
                const s = new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date().toISOString(),
                    articleType: 'feature',
                });
                expect(s.articleType).toBe(ArticleType.FEATURE_ARTICLE);
            });
            it('research-advance', () => {
                const s = new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date().toISOString(),
                    articleType: 'research-advance',
                });
                expect(s.articleType).toBe(ArticleType.RESEARCH_ADVANCE);
            });
            it('scientific-correspondence', () => {
                const s = new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date().toISOString(),
                    articleType: 'scientific-correspondence',
                });
                expect(s.articleType).toBe(ArticleType.SCIENTIFIC_CORRESPONDENCE);
            });
            it('tools-resources', () => {
                const s = new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date().toISOString(),
                    articleType: 'tools-resources',
                });
                expect(s.articleType).toBe(ArticleType.TOOLS_RESOURCES);
            });
            it('short-report', () => {
                const s = new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date().toISOString(),
                    articleType: 'short-report',
                });
                expect(s.articleType).toBe(ArticleType.SHORT_REPORT);
            });
        });
        it('articleType has 6 values', () => {
            expect(Object.keys(ArticleType).length).toBe(7);
        });
    });

    describe('addOppositionReasons', () => {
        it('add opposed editors reasons on the right fields', () => {
            submission.addOppositionReasons('one', 'two', 'three');
            expect(submission.editorDetails.opposedReviewersReason).toBe('one');
            expect(submission.editorDetails.opposedReviewingEditorsReason).toBe('two');
            expect(submission.editorDetails.opposedSeniorEditorsReason).toBe('three');
        });
    });

    describe('Un-Submittable when', () => {
        it('is a new submission', () => {
            expect(() => submission.isSubmittable()).toThrow('"manuscriptDetails.title" is required');
        });

        it('status is MECA_IMPORT_SUCCEEDED', () => {
            setValidSubmission();
            submission.status = 'MECA_IMPORT_SUCCEEDED';
            expect(() => submission.isSubmittable()).toThrow('"status" must be [INITIAL]');
        });

        // one test from disclosure-schema
        it('no disclosure consent', () => {
            setValidSubmission();
            submission.disclosure.disclosureConsent = false;
            expect(() => submission.isSubmittable()).toThrow('"disclosure.disclosureConsent" must be [true]');
        });

        // one test from files-schema
        it('manuscript file not in STORED state', () => {
            setValidSubmission();
            if (submission.files.manuscriptFile) {
                submission.files.manuscriptFile.status = FileStatus.CREATED;
            }
            expect(() => submission.isSubmittable()).toThrow('"files.manuscriptFile.status" must be [STORED]');
        });

        // one test from authorDetail-schema
        it('author has no email', () => {
            setValidSubmission();
            if (submission.author) {
                submission.author.email = '';
            }
            expect(() => submission.isSubmittable()).toThrow('"author.email" is not allowed to be empty');
        });

        // one test from editorDetails-schema
        it('no suggested senior editors', () => {
            setValidSubmission();
            if (submission.editorDetails) {
                submission.editorDetails.suggestedSeniorEditors = [];
            }
            expect(() => submission.isSubmittable()).toThrow(
                '"editorDetails.suggestedSeniorEditors" does not contain 1 required value(s)',
            );
        });

        // one test from manuscriptDetails-schema
        it('there is no title', () => {
            setValidSubmission();
            if (submission.manuscriptDetails) {
                submission.manuscriptDetails.title = '';
            }
            expect(() => submission.isSubmittable()).toThrow('"manuscriptDetails.title" is not allowed to be empty');
        });
    });

    describe('Submittable when', () => {
        it('fields set', () => {
            setValidSubmission();
            expect(submission.isSubmittable()).toBe(true);
        });
        it('is feature article and no subjects', () => {
            setValidSubmission();
            submission.articleType = ArticleType.FEATURE_ARTICLE;
            submission.manuscriptDetails.subjects = [];
            expect(submission.isSubmittable()).toBe(true);
        });
        it('is feature article and no suggested senior editors', () => {
            setValidSubmission();
            submission.articleType = ArticleType.FEATURE_ARTICLE;
            submission.editorDetails.suggestedSeniorEditors = [];
            expect(submission.isSubmittable()).toBe(true);
        });
        it('is feature article and no suggested reviewing editors', () => {
            setValidSubmission();
            submission.articleType = ArticleType.FEATURE_ARTICLE;
            submission.editorDetails.suggestedReviewingEditors = [];
            expect(submission.isSubmittable()).toBe(true);
        });
    });
});
