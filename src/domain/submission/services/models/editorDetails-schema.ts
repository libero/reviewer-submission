import * as Joi from 'joi';

const MIN_SUGGESTED_SENIOR_EDITORS = 2;
const MAX_SUGGESTED_SENIOR_EDITORS = 6;
const MIN_SUGGESTED_REVIEWING_EDITORS = 2;
const MAX_SUGGESTED_REVIEWING_EDITORS = 6;
const MAX_SUGGESTED_REVIEWERS = 6;
const MAX_OPPOSED_REVIEWING_EDITORS = 2;
const MAX_OPPOSED_SENIOR_EDITORS = 1;
const MAX_OPPOSED_REVIEWERS = 2;

const suggestedSeniorEditorsSchema = Joi.array()
    .items(Joi.string().required())
    .min(MIN_SUGGESTED_SENIOR_EDITORS)
    .max(MAX_SUGGESTED_SENIOR_EDITORS)
    .required();

const suggestedReviewingEditorsSchema = Joi.array()
    .items(Joi.string().required())
    .min(MIN_SUGGESTED_REVIEWING_EDITORS)
    .max(MAX_SUGGESTED_REVIEWING_EDITORS)
    .required();

const featureSuggestedSeniorEditorsSchema = Joi.array().max(MAX_SUGGESTED_SENIOR_EDITORS);

const featureSuggestedReviewingEditorsSchema = Joi.array().max(MAX_SUGGESTED_REVIEWING_EDITORS);

const base = {
    opposedSeniorEditors: Joi.array()
        .items(Joi.string())
        .required()
        .max(MAX_OPPOSED_SENIOR_EDITORS),
    opposedSeniorEditorsReason: Joi.string().when('opposedSeniorEditors', {
        is: Joi.array().min(1),
        then: Joi.string().required(),
        otherwise: Joi.string().allow(''),
    }),
    opposedReviewingEditors: Joi.array()
        .items(Joi.string())
        .required()
        .max(MAX_OPPOSED_REVIEWING_EDITORS),
    opposedReviewingEditorsReason: Joi.string().when('opposedReviewingEditors', {
        is: Joi.array().min(1),
        then: Joi.string().required(),
        otherwise: Joi.string().allow(''),
    }),
    suggestedReviewers: Joi.array()
        .items(
            Joi.object().keys({
                name: Joi.string().required(),
                email: Joi.string()
                    .email()
                    .required(),
            }),
        )
        .max(MAX_SUGGESTED_REVIEWERS),
    opposedReviewers: Joi.array()
        .items(
            Joi.object().keys({
                name: Joi.string().required(),
                email: Joi.string()
                    .email()
                    .required(),
            }),
        )
        .max(MAX_OPPOSED_REVIEWERS),
    opposedReviewersReason: Joi.string().when('opposedReviewers', {
        is: Joi.array().min(1),
        then: Joi.string().required(),
        otherwise: Joi.string().allow(''),
    }),
};

export const editorDetailsSchema = Joi.object({
    ...base,
    suggestedSeniorEditors: suggestedSeniorEditorsSchema,
    suggestedReviewingEditors: suggestedReviewingEditorsSchema,
});

export const featureEditorDetailsSchema = Joi.object({
    ...base,
    suggestedSeniorEditors: featureSuggestedSeniorEditorsSchema,
    suggestedReviewingEditors: featureSuggestedReviewingEditorsSchema,
});