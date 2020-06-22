import * as Joi from 'joi';

const subjectSchema = Joi.array()
    .min(1)
    .max(2)
    .required();

const featureSubjectSchema = Joi.array().max(2);

const base = {
    title: Joi.string().required(),
    previouslyDiscussed: Joi.string().allow('', null),
    previouslySubmitted: Joi.string().allow('', null),
    cosubmission: Joi.array().items(Joi.string()),
};

export const manuscriptDetailsSchema = Joi.object({
    ...base,
    subjects: subjectSchema,
});

export const featureManuscriptDetailsSchema = Joi.object({
    ...base,
    subjects: featureSubjectSchema,
});
