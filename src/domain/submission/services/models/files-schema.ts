import * as Joi from 'joi';
import { fileSchema } from './file-schema';

export const filesSchema = Joi.object({
    coverLetter: Joi.string().required(),
    manuscriptFile: fileSchema.required(),
    supportingFiles: Joi.array().items(fileSchema),
});
