import * as Joi from 'joi';

export const disclosureSchema = Joi.object({
    submitterSignature: Joi.string().required(),
    disclosureConsent: Joi.bool()
        .required()
        .equal(true),
});
