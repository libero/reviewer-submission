import * as Joi from 'joi';
// We use same email regex as yup instead of joi .email() as the front end is more permissive causing server side errors on submit when email is a typo
const EMAIL_REGEX = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
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
                    .regex(EMAIL_REGEX)
                    .error(errors => {
                        if (!errors.length || !errors[0].code) {
                            throw new Error("Bad errors object. Couldn't map error message.");
                        }
                        return errors[0].code === 'string.pattern.base'
                            ? new Error(`"${errors[0].path.join('.')}" must be a valid email`)
                            : errors[0];
                    })
                    .required(),
            }),
        )
        .max(MAX_SUGGESTED_REVIEWERS),
    opposedReviewers: Joi.array()
        .items(
            Joi.object().keys({
                name: Joi.string().required(),
                email: Joi.string()
                    .regex(EMAIL_REGEX)
                    .error(errors => {
                        if (!errors.length || !errors[0].code) {
                            throw new Error("Bad errors object. Couldn't map error message.");
                        }
                        return errors[0].code === 'string.pattern.base'
                            ? new Error(`"${errors[0].path.join('.')}" must be a valid email`)
                            : errors[0];
                    })
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
