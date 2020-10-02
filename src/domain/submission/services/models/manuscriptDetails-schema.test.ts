import * as Joi from 'joi';
import { manuscriptDetailsSchema } from './manuscriptDetails-schema';

describe('author schema', () => {
    let details: {
        title: string;
        subjects: string[];
        previouslyDiscussed: string | null;
        previouslySubmitted: string;
        cosubmission: string[];
    };

    beforeEach(() => {
        details = {
            title: 'title',
            subjects: ['s1', 's2'],
            previouslyDiscussed: 'prev-d',
            previouslySubmitted: 'prev-s',
            cosubmission: ['a', 'b'],
        };
    });

    describe('succeeds when', () => {
        it('valid', () => {
            const { error, value } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('previously discussed is empty', () => {
            details.previouslyDiscussed = '';
            const { error, value } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('previously discussed is null', () => {
            details.previouslyDiscussed = null;
            const { error, value } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('previously submitted is empty', () => {
            details.previouslySubmitted = '';
            const { error, value } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('co-submissions is empty', () => {
            details.cosubmission = [];
            const { error, value } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
    });

    describe('fails when', () => {
        it('no title', () => {
            details.title = '';
            const { error } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(error?.message).toEqual(
                'ValidationError: child "title" fails because ["title" is not allowed to be empty]',
            );
        });
        it('no subjects', () => {
            details.subjects = [];
            const { error } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(error?.message).toEqual(
                'ValidationError: child "subjects" fails because ["subjects" must contain at least 1 items]',
            );
        });
        it('3 subjects', () => {
            details.subjects = ['a', 'b', 'c'];
            const { error } = manuscriptDetailsSchema.validate(manuscriptDetailsSchema);
            expect(error?.message).toEqual(
                'ValidationError: child "subjects" fails because ["subjects" must contain less than or equal to 2 items]',
            );
        });
    });
});
