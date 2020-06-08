import * as Joi from 'joi';
import { fileSchema } from './file-schema';

export type TestFile = {
    id: string;
    submissionId: string;
    created: Date;
    updated: Date;
    type: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    status: string;
};

describe('file schema', () => {
    let file: TestFile;

    beforeEach(() => {
        file = {
            id: '123',
            submissionId: '456',
            created: new Date(),
            updated: new Date(),
            type: 'type',
            filename: 'filename',
            url: 'url',
            mimeType: 'mime',
            size: 10,
            status: 'STORED',
        };
    });

    describe('succeeds when', () => {
        it('valid', () => {
            const { error, value } = Joi.validate(file, fileSchema);
            expect(value).toStrictEqual(file);
            expect(error).toBeNull();
        });
    });
    describe('fails when', () => {
        it('file not stored', () => {
            file.status = 'CREATED';
            const { error } = Joi.validate(file, fileSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "status" fails because ["status" must be one of [STORED]]',
            );
        });
    });
});
