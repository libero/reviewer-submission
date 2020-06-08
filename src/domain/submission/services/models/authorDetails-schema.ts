import * as Joi from 'joi';

export const authorSchema = Joi.object()
    .keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string()
            .email()
            .required(),
        aff: Joi.string().required(),
    })
    .required();
