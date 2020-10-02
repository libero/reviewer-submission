import { editorDetailsSchema } from './editorDetails-schema';

type reviewer = { name: string; email: string };

describe('author schema', () => {
    let editors: {
        suggestedSeniorEditors: string[];
        opposedSeniorEditors: string[];
        opposedSeniorEditorsReason: string;
        suggestedReviewingEditors: string[];
        opposedReviewingEditors: string[];
        opposedReviewingEditorsReason: string;
        suggestedReviewers: reviewer[];
        opposedReviewers: reviewer[];
        opposedReviewersReason: string;
    };

    beforeEach(() => {
        editors = {
            suggestedSeniorEditors: ['A1', 'B1'],
            opposedSeniorEditors: ['O1'],
            opposedSeniorEditorsReason: 'R1',
            suggestedReviewingEditors: ['A2', 'B2'],
            opposedReviewingEditors: ['O2'],
            opposedReviewingEditorsReason: 'R2',
            suggestedReviewers: [
                { name: 'A3', email: 'A3@here.com' },
                { name: 'B3', email: 'B3@here.com' },
            ],
            opposedReviewers: [{ name: 'O3', email: 'O3@here.com' }],
            opposedReviewersReason: 'R3',
        };
    });

    describe('succeeds when', () => {
        it('valid', () => {
            const { error, value } = editorDetailsSchema.validate(editors);
            expect(value).toStrictEqual(editors);
            expect(error).toBeUndefined();
        });
        it('no opposed Senior Editors', () => {
            editors.opposedSeniorEditors = [];
            const { error, value } = editorDetailsSchema.validate(editors);
            expect(value).toStrictEqual(editors);
            expect(error).toBeUndefined();
        });
        it('no opposed Reviewing Editors', () => {
            editors.opposedReviewingEditors = [];
            const { error, value } = editorDetailsSchema.validate(editors);
            expect(value).toStrictEqual(editors);
            expect(error).toBeUndefined();
        });
        it('no opposed Reviewers', () => {
            editors.opposedReviewers = [];
            const { error, value } = editorDetailsSchema.validate(editors);
            expect(value).toStrictEqual(editors);
            expect(error).toBeUndefined();
        });
        it('no suggested Reviewers', () => {
            editors.suggestedReviewers = [];
            const { error, value } = editorDetailsSchema.validate(editors);
            expect(value).toStrictEqual(editors);
            expect(error).toBeUndefined();
        });
    });

    describe('fails when', () => {
        it('no suggested Senior Editors', () => {
            editors.suggestedSeniorEditors = [];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"suggestedSeniorEditors" does not contain 1 required value(s)');
        });
        it('7 suggested Senior Editors', () => {
            editors.suggestedSeniorEditors = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"suggestedSeniorEditors" must contain less than or equal to 6 items');
        });
        it('2 opposed Senior Editors', () => {
            editors.opposedSeniorEditors = ['a', 'b'];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"opposedSeniorEditors" must contain less than or equal to 1 items');
        });
        it('opposed Senior Editors without reason', () => {
            editors.opposedSeniorEditorsReason = '';
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"opposedSeniorEditorsReason" is not allowed to be empty');
        });

        it('no suggested Reviewing Editors', () => {
            editors.suggestedReviewingEditors = [];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"suggestedReviewingEditors" does not contain 1 required value(s)');
        });
        it('7 suggested Reviewing Editors', () => {
            editors.suggestedReviewingEditors = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"suggestedReviewingEditors" must contain less than or equal to 6 items');
        });
        it('3 opposed Reviewing Editors', () => {
            editors.opposedReviewingEditors = ['a', 'b', 'c'];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"opposedReviewingEditors" must contain less than or equal to 2 items');
        });
        it('opposed Reviewing Editors without reason', () => {
            editors.opposedReviewingEditorsReason = '';
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"opposedReviewingEditorsReason" is not allowed to be empty');
        });

        it('7 suggested Reviewers', () => {
            editors.suggestedReviewers = [
                { name: 'a', email: 'a@a.com' },
                { name: 'b', email: 'b@b.com' },
                { name: 'c', email: 'c@c.com' },
                { name: 'd', email: 'd@d.com' },
                { name: 'e', email: 'e@e.com' },
                { name: 'f', email: 'f@f.com' },
                { name: 'g', email: 'g@g.com' },
            ];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"suggestedReviewers" must contain less than or equal to 6 items');
        });
        it('3 opposed Reviewers', () => {
            editors.opposedReviewers = [
                { name: 'a', email: 'a@a-a.com' },
                { name: 'b', email: 'b.a@b-c.com' },
                { name: 'c', email: 'c-aa@c-b.com' },
            ];
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"opposedReviewers" must contain less than or equal to 2 items');
        });
        it('opposed Reviewers without reason', () => {
            editors.opposedReviewersReason = '';
            const { error } = editorDetailsSchema.validate(editors);
            expect(error?.message).toEqual('"opposedReviewersReason" is not allowed to be empty');
        });
    });
});
