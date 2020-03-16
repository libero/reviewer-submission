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
            title: '',
            status: SubmissionStatus.INITIAL,
            createdBy: '123',
            updated: new Date(),
            articleType: 'researchArticle',
        });
    });

    describe('constructor', () => {
        it('creates a new entity and correctly sets properties from constructor params', () => {
            expect(submission).toBeInstanceOf(Submission);
            expect(submission.title).toBe('');
            expect(submission.id).toBe(id);
            expect(submission.status).toBe('INITIAL');
            expect(submission.articleType).toBe('researchArticle');
            expect(submission.createdBy).toBe('123');
            expect(submission.updated).toBeDefined();
        });

        it('throws if an invalid articleType is passed', () => {
            expect(() => {
                new Submission({
                    id,
                    title: '',
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
            'child "title" fails because ["title" is not allowed to be empty]',
        );
    });

    it('new submission is submittable when fields set', () => {
        submission.title = 'Test';
        submission.coverLetter = 'Accept please!';
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
        submission.manuscriptFile = file;

        expect(submission.isSubmittable()).toBe(true);
    });
});
