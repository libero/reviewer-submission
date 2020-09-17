import * as Joi from 'joi';
import { FileStatus } from '../../../file/types';

export const fileSchema = Joi.object({
    id: Joi.string().required(),
    submissionId: Joi.string().required(),
    created: Joi.date().required(),
    updated: Joi.date().required(),
    type: Joi.string().required(),
    filename: Joi.string().required(),
    url: Joi.string().required(),
    mimeType: Joi.string().required(),
    size: Joi.number()
        .required()
        .allow(null), // this allows submissions from xPub to pass validation
    downloadLink: Joi.string(),
    status: Joi.string()
        .required()
        .equal(FileStatus.STORED),
});
