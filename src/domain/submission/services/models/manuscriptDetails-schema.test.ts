import * as Joi from 'joi';
import { manuscriptDetailsSchema } from './manuscriptDetails-schema';

describe('author schema', () => {
    let details: {
        title: string;
        subjects: string[];
        previouslyDiscussed: string | null;
        previouslySubmitted: string[];
        cosubmission: string[];
    };

    beforeEach(() => {
        details = {
            title: 'title',
            subjects: ['s1', 's2'],
            previouslyDiscussed: 'prev-d',
            previouslySubmitted: ['prev-s1', 'prev-s2'],
            cosubmission: ['a', 'b'],
        };
    });

    describe('succeeds when', () => {
        it('valid', () => {
            const { error, value } = Joi.validate(details, manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('previously discussed is empty', () => {
            details.previouslyDiscussed = '';
            const { error, value } = Joi.validate(details, manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('previously discussed is null', () => {
            details.previouslyDiscussed = null;
            const { error, value } = Joi.validate(details, manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('previously submitted is empty', () => {
            details.previouslySubmitted = [];
            const { error, value } = Joi.validate(details, manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
        it('co-submissions is empty', () => {
            details.cosubmission = [];
            const { error, value } = Joi.validate(details, manuscriptDetailsSchema);
            expect(value).toStrictEqual(details);
            expect(error).toBeNull();
        });
    });

    describe('fails when', () => {
        it('no title', () => {
            details.title = '';
            const { error } = Joi.validate(details, manuscriptDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "title" fails because ["title" is not allowed to be empty]',
            );
        });
        it('no subjects', () => {
            details.subjects = [];
            const { error } = Joi.validate(details, manuscriptDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "subjects" fails because ["subjects" must contain at least 1 items]',
            );
        });
        it('3 subjects', () => {
            details.subjects = ['a', 'b', 'c'];
            const { error } = Joi.validate(details, manuscriptDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "subjects" fails because ["subjects" must contain less than or equal to 2 items]',
            );
        });
    });
});
