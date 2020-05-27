import { v4 as uuid } from 'uuid';
import Submission, { SubmissionStatus } from './submission';
import { SubmissionId } from '../../types';
import File from '../../../file/services/models/file';
import { FileId, FileType } from '../../../file/types';

describe('Submission Entity', () => {
    let id: SubmissionId;
    let submission: Submission;

    beforeEach(() => {
        id = SubmissionId.fromUuid(uuid());
        submission = new Submission({
            id: id,
            status: SubmissionStatus.INITIAL,
            createdBy: '123',
            updated: new Date(),
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
        });

        it('throws if an invalid articleType is passed', () => {
            expect(() => {
                new Submission({
                    id,
                    status: SubmissionStatus.INITIAL,
                    createdBy: '123',
                    updated: new Date(),
                    articleType: 'foo',
                });
            }).toThrow('Invalid article type');
        });
    });

    it('new submission is not submittable', () => {
        expect(() => submission.isSubmittable()).toThrow(
            'child "manuscriptDetails" fails because [child "title" fails because ["title" is required]]',
        );
    });

    it('new submission is submittable when fields set', () => {
        submission.manuscriptDetails.title = 'Test';
        submission.manuscriptDetails.cosubmission = ['Test'];
        submission.files.coverLetter = 'Accept please!';
        submission.disclosure.submitterSignature = 'signature';
        submission.editorDetails.suggestedSeniorEditors = ['123', '321'];
        submission.editorDetails.opposedSeniorEditors = ['234', '432'];
        submission.editorDetails.opposedSeniorEditorsReason = 'reason';
        submission.editorDetails.suggestedReviewingEditors = ['567', '765'];
        submission.editorDetails.opposedReviewingEditors = ['8910'];
        submission.editorDetails.opposedReviewingEditorsReason = 'reason 2';
        submission.editorDetails.suggestedReviewers = [{ name: 'name1', email: 'name1@elifesciences.org' }];
        submission.editorDetails.opposedReviewers = [{ name: 'name2', email: 'name2@elifesciences.org' }];
        submission.editorDetails.opposedReviewersReason = 'because';

        submission.disclosure.disclosureConsent = false;

        submission.author = {
            firstName: 'smith',
            lastName: 'Jane',
            email: 'email@elifesciences.org',
            aff: 'int',
        };

        const file = new File({
            id: FileId.fromUuid(uuid()),
            submissionId: id,
            created: new Date(),
            updated: new Date(),
            type: FileType.MANUSCRIPT_SOURCE,
            filename: 'readme',
            mimeType: 'text',
            size: 100,
            status: 'ok',
        });
        submission.files.manuscriptFile = file;

        expect(submission.isSubmittable()).toBe(true);
    });
});
