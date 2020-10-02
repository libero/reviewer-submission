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
            const { error, value } = manuscriptDetailsSchema.validate(details);
            expect(value).toStrictEqual(details);
            expect(error).toBeUndefined();
        });
        it('previously discussed is empty', () => {
            details.previouslyDiscussed = '';
            const { error, value } = manuscriptDetailsSchema.validate(details);
            expect(value).toStrictEqual(details);
            expect(error).toBeUndefined();
        });
        it('previously discussed is null', () => {
            details.previouslyDiscussed = null;
            const { error, value } = manuscriptDetailsSchema.validate(details);
            expect(value).toStrictEqual(details);
            expect(error).toBeUndefined();
        });
        it('previously submitted is empty', () => {
            details.previouslySubmitted = '';
            const { error, value } = manuscriptDetailsSchema.validate(details);
            expect(value).toStrictEqual(details);
            expect(error).toBeUndefined();
        });
        it('co-submissions is empty', () => {
            details.cosubmission = [];
            const { error, value } = manuscriptDetailsSchema.validate(details);
            expect(value).toStrictEqual(details);
            expect(error).toBeUndefined();
        });
    });

    describe('fails when', () => {
        it('no title', () => {
            details.title = '';
            const { error } = manuscriptDetailsSchema.validate(details);
            expect(error?.message).toEqual('"title" is not allowed to be empty');
        });
        it('no subjects', () => {
            details.subjects = [];
            const { error } = manuscriptDetailsSchema.validate(details);
            expect(error?.message).toEqual('"subjects" must contain at least 1 items');
        });
        it('3 subjects', () => {
            details.subjects = ['a', 'b', 'c'];
            const { error } = manuscriptDetailsSchema.validate(details);
            expect(error?.message).toEqual('"subjects" must contain less than or equal to 2 items');
        });
    });
});
