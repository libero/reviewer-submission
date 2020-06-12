import * as Joi from 'joi';
import { authorSchema } from './authorDetails-schema';

describe('author schema', () => {
    let author: { firstName: string; lastName: string; email: string; institution: string };

    beforeEach(() => {
        author = {
            firstName: 'A',
            lastName: 'B',
            email: 'C@here.com',
            institution: 'D',
        };
    });

    describe('succeeds when', () => {
        it('valid', () => {
            const { error, value } = Joi.validate(author, authorSchema);
            expect(value).toStrictEqual(author);
            expect(error).toBeNull();
        });
    });
    describe('fails when', () => {
        it('no first name', () => {
            author.firstName = '';
            const { error } = Joi.validate(author, authorSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "firstName" fails because ["firstName" is not allowed to be empty]',
            );
        });
        it('no last name', () => {
            author.lastName = '';
            const { error } = Joi.validate(author, authorSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "lastName" fails because ["lastName" is not allowed to be empty]',
            );
        });
        it('no affiliation', () => {
            author.institution = '';
            const { error } = Joi.validate(author, authorSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "institution" fails because ["institution" is not allowed to be empty]',
            );
        });
        it('no email', () => {
            author.email = '';
            const { error } = Joi.validate(author, authorSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "email" fails because ["email" is not allowed to be empty]',
            );
        });
        it('invalid email', () => {
            author.email = 'abc';
            const { error } = Joi.validate(author, authorSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "email" fails because ["email" must be a valid email]',
            );
        });
    });
});
