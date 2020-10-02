import * as Joi from 'joi';
import { filesSchema } from './files-schema';
import { manuscriptDetailsSchema, featureManuscriptDetailsSchema } from './manuscriptDetails-schema';
import { editorDetailsSchema, featureEditorDetailsSchema } from './editorDetails-schema';
import { authorSchema } from './authorDetails-schema';
import { disclosureSchema } from './disclosure-schema';
import { SubmissionStatus } from '../../types';

export const submissionSchema = Joi.object({
    id: Joi.string().required(),
    created: Joi.date().required(),
    updated: Joi.date().required(),
    status: Joi.string()
        .required()
        .equal(SubmissionStatus.INITIAL),
    createdBy: Joi.string().required(),
    articleType: Joi.string()
        .required()
        .valid(
            ...[
                'research-article',
                'feature',
                'research-advance',
                'scientific-correspondence',
                'tools-resources',
                'short-report',
            ],
        ),
    manuscriptDetails: Joi.when('articleType', {
        is: 'feature',
        then: featureManuscriptDetailsSchema,
        otherwise: manuscriptDetailsSchema,
    }),
    files: filesSchema,
    editorDetails: Joi.when('articleType', {
        is: 'feature',
        then: featureEditorDetailsSchema,
        otherwise: editorDetailsSchema,
    }),
    disclosure: disclosureSchema,
    suggestions: Joi.array(), // allow anything as not required for submission
    author: authorSchema,
    lastStepVisited: Joi.string(),
});
