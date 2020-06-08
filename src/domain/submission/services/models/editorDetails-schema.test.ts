import * as Joi from 'joi';
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
            const { error, value } = Joi.validate(editors, editorDetailsSchema);
            expect(value).toStrictEqual(editors);
            expect(error).toBeNull();
        });
        it('no opposed Senior Editors', () => {
            editors.opposedSeniorEditors = [];
            const { error, value } = Joi.validate(editors, editorDetailsSchema);
            expect(value).toStrictEqual(editors);
            expect(error).toBeNull();
        });
        it('no opposed Reviewing Editors', () => {
            editors.opposedReviewingEditors = [];
            const { error, value } = Joi.validate(editors, editorDetailsSchema);
            expect(value).toStrictEqual(editors);
            expect(error).toBeNull();
        });
        it('no opposed Reviewers', () => {
            editors.opposedReviewers = [];
            const { error, value } = Joi.validate(editors, editorDetailsSchema);
            expect(value).toStrictEqual(editors);
            expect(error).toBeNull();
        });
        it('no suggested Reviewers', () => {
            editors.suggestedReviewers = [];
            const { error, value } = Joi.validate(editors, editorDetailsSchema);
            expect(value).toStrictEqual(editors);
            expect(error).toBeNull();
        });
    });

    describe('fails when', () => {
        it('no suggested Senior Editors', () => {
            editors.suggestedSeniorEditors = [];
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "suggestedSeniorEditors" fails because ["suggestedSeniorEditors" does not contain 1 required value(s)]',
            );
        });
        it('7 suggested Senior Editors', () => {
            editors.suggestedSeniorEditors = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "suggestedSeniorEditors" fails because ["suggestedSeniorEditors" must contain less than or equal to 6 items]',
            );
        });
        it('2 opposed Senior Editors', () => {
            editors.opposedSeniorEditors = ['a', 'b'];
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "opposedSeniorEditors" fails because ["opposedSeniorEditors" must contain less than or equal to 1 items]',
            );
        });
        it('opposed Senior Editors without reason', () => {
            editors.opposedSeniorEditorsReason = '';
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "opposedSeniorEditorsReason" fails because ["opposedSeniorEditorsReason" is not allowed to be empty]',
            );
        });

        it('no suggested Reviewing Editors', () => {
            editors.suggestedReviewingEditors = [];
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "suggestedReviewingEditors" fails because ["suggestedReviewingEditors" does not contain 1 required value(s)]',
            );
        });
        it('7 suggested Reviewing Editors', () => {
            editors.suggestedReviewingEditors = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "suggestedReviewingEditors" fails because ["suggestedReviewingEditors" must contain less than or equal to 6 items]',
            );
        });
        it('3 opposed Reviewing Editors', () => {
            editors.opposedReviewingEditors = ['a', 'b', 'c'];
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "opposedReviewingEditors" fails because ["opposedReviewingEditors" must contain less than or equal to 2 items]',
            );
        });
        it('opposed Reviewing Editors without reason', () => {
            editors.opposedReviewingEditorsReason = '';
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "opposedReviewingEditorsReason" fails because ["opposedReviewingEditorsReason" is not allowed to be empty]',
            );
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
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "suggestedReviewers" fails because ["suggestedReviewers" must contain less than or equal to 6 items]',
            );
        });
        it('3 opposed Reviewers', () => {
            editors.opposedReviewers = [
                { name: 'a', email: 'a@a.com' },
                { name: 'b', email: 'b@b.com' },
                { name: 'c', email: 'c@c.com' },
            ];
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "opposedReviewers" fails because ["opposedReviewers" must contain less than or equal to 2 items]',
            );
        });
        it('opposed Reviewers without reason', () => {
            editors.opposedReviewersReason = '';
            const { error } = Joi.validate(editors, editorDetailsSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "opposedReviewersReason" fails because ["opposedReviewersReason" is not allowed to be empty]',
            );
        });
    });
});
