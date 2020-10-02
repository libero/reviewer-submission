import { disclosureSchema } from './disclosure-schema';

describe('author schema', () => {
    let disclosure: { submitterSignature: string; disclosureConsent: boolean };

    beforeEach(() => {
        disclosure = {
            submitterSignature: 'mickey mouse',
            disclosureConsent: true,
        };
    });

    describe('succeeds when', () => {
        it('valid', () => {
            const { error, value } = disclosureSchema.validate(disclosure);
            expect(value).toStrictEqual(disclosure);
            expect(error).toBeUndefined();
        });
    });
    describe('fails when', () => {
        it('no consent', () => {
            disclosure.disclosureConsent = false;
            const { error } = disclosureSchema.validate(disclosure);
            expect(error?.message).toEqual('"disclosureConsent" must be [true]');
        });
        it('no signature', () => {
            disclosure.submitterSignature = '';
            const { error } = disclosureSchema.validate(disclosure);
            expect(error?.message).toEqual('"submitterSignature" is not allowed to be empty');
        });
    });
});
