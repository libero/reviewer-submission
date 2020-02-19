import { v4 as uuid } from 'uuid';
import Submission from './submission';
import { SubmissionId } from '../submission';

describe('Submission Entity', () => {
    describe('constructor', () => {
        it('creates a new entity and correctly sets properties from constructor params', () => {
            const id = SubmissionId.fromUuid(uuid());
            const submission = new Submission({
                id: id,
                title: '',
                status: 'INITIAL',
                createdBy: '123',
                updated: new Date(),
                articleType: 'researchArticle',
            });

            expect(submission).toBeInstanceOf(Submission);
            expect(submission.title).toBe('');
            expect(submission.id).toBe(id);
            expect(submission.status).toBe('INITIAL');
            expect(submission.articleType).toBe('researchArticle');
            expect(submission.createdBy).toBe('123');
            expect(submission.updated).toBeDefined();
        });

        it('throws if an invalid articleType is passed', () => {
            const id = SubmissionId.fromUuid(uuid());
            expect(() => {
                new Submission({
                    id: id,
                    title: '',
                    status: 'INITIAL',
                    createdBy: '123',
                    updated: new Date(),
                    articleType: 'foo',
                });
            }).toThrow('Invalid article type');
        });
    });
});
