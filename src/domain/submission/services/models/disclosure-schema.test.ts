import * as Joi from 'joi';
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
            const { error, value } = Joi.validate(disclosure, disclosureSchema);
            expect(value).toStrictEqual(disclosure);
            expect(error).toBeNull();
        });
    });
    describe('fails when', () => {
        it('no consent', () => {
            disclosure.disclosureConsent = false;
            const { error } = Joi.validate(disclosure, disclosureSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "disclosureConsent" fails because ["disclosureConsent" must be one of [true]]',
            );
        });
        it('no signature', () => {
            disclosure.submitterSignature = '';
            const { error } = Joi.validate(disclosure, disclosureSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "submitterSignature" fails because ["submitterSignature" is not allowed to be empty]',
            );
        });
    });
});
