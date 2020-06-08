import * as Joi from 'joi';
import { filesSchema } from './files-schema';
import { TestFile } from './file-schema.test';

describe('file schema', () => {
    let files: {
        coverLetter: string;
        manuscriptFile: TestFile | null;
        supportingFiles: TestFile[];
    };
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
        files = {
            coverLetter: 'good stuff',
            manuscriptFile: file,
            supportingFiles: [file, file, file],
        };
    });

    describe('succeeds when', () => {
        it('valid', () => {
            const { error, value } = Joi.validate(files, filesSchema);
            expect(value).toStrictEqual(files);
            expect(error).toBeNull();
        });
        it('no supporting files', () => {
            files.supportingFiles = [];
            const { error, value } = Joi.validate(files, filesSchema);
            expect(value).toStrictEqual(files);
            expect(error).toBeNull();
        });
    });

    describe('fails when', () => {
        it('cover letter missing', () => {
            files.coverLetter = '';
            const { error } = Joi.validate(files, filesSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "coverLetter" fails because ["coverLetter" is not allowed to be empty]',
            );
        });
        it('manuscript missing', () => {
            files.manuscriptFile = null;
            const { error } = Joi.validate(files, filesSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "manuscriptFile" fails because ["manuscriptFile" must be an object]',
            );
        });
        it('manuscript not stored', () => {
            if (files.manuscriptFile) {
                files.manuscriptFile.status = 'CREATED';
            }
            const { error } = Joi.validate(files, filesSchema);
            expect(error.toString()).toEqual(
                'ValidationError: child "manuscriptFile" fails because [child "status" fails because ["status" must be one of [STORED]]]',
            );
        });
    });
});
