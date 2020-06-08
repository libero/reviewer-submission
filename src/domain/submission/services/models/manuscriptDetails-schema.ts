import * as Joi from 'joi';

export const manuscriptDetailsSchema = Joi.object({
    title: Joi.string().required(),
    subjects: Joi.alternatives().when('articleType', {
        is: 'feature',
        then: Joi.array().max(2),
        otherwise: Joi.array()
            .min(1)
            .max(2)
            .required(),
    }),

    previouslyDiscussed: Joi.string().allow('', null),
    previouslySubmitted: Joi.array().items(Joi.string()),
    cosubmission: Joi.array()
        .items(Joi.string())
        .required(),
});
