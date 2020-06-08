import * as Joi from 'joi';
import { filesSchema } from './files-schema';
import { manuscriptDetailsSchema } from './manuscriptDetails-schema';
import { editorDetailsSchema } from './editorDetails-schema';
import { authorSchema } from './authorDetails-schema';
import { disclosureSchema } from './disclosure-schema';

export const submissionSchema = Joi.object({
    id: Joi.string().required(),
    created: Joi.date().required(),
    updated: Joi.date().required(),
    status: Joi.string().required(),
    createdBy: Joi.string().required(),
    articleType: Joi.string().required(),
    manuscriptDetails: manuscriptDetailsSchema,
    files: filesSchema,
    editorDetails: editorDetailsSchema,
    disclosure: disclosureSchema,
    suggestions: Joi.array(), // allow anything as not required for submission
    author: authorSchema,
});
