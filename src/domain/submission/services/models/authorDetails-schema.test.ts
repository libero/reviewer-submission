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
            const { error, value } = authorSchema.validate(author);
            expect(value).toStrictEqual(author);
            expect(error).toBeUndefined();
        });
    });
    describe('fails when', () => {
        it('no first name', () => {
            author.firstName = '';
            const { error } = authorSchema.validate(author);
            expect(error?.message).toEqual('"firstName" is not allowed to be empty');
        });
        it('no last name', () => {
            author.lastName = '';
            const { error } = authorSchema.validate(author);
            expect(error?.message).toEqual('"lastName" is not allowed to be empty');
        });
        it('no affiliation', () => {
            author.institution = '';
            const { error } = authorSchema.validate(author);
            expect(error?.message).toEqual('"institution" is not allowed to be empty');
        });
        it('no email', () => {
            author.email = '';
            const { error } = authorSchema.validate(author);
            expect(error?.message).toEqual('"email" is not allowed to be empty');
        });
        it('invalid email', () => {
            author.email = 'abc';
            const { error } = authorSchema.validate(author);
            expect(error?.message).toEqual('"email" must be a valid email');
        });
    });
});
