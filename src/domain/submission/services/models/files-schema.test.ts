import { filesSchema } from './files-schema';
import { TestFile } from './file-schema.test';

describe('file schema', () => {
    let files: {
        coverLetter?: string;
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
            const { error, value } = filesSchema.validate(files);
            expect(value).toStrictEqual(files);
            expect(error).toBeUndefined();
        });
        it('no supporting files', () => {
            files.supportingFiles = [];
            const { error, value } = filesSchema.validate(files);
            expect(value).toStrictEqual(files);
            expect(error).toBeUndefined();
        });
        it('no cover letter', () => {
            delete files.coverLetter;
            const { error, value } = filesSchema.validate(files);
            expect(value).toStrictEqual(files);
            expect(error).toBeUndefined();
        });
        it('cover letter empty string', () => {
            files.coverLetter = '';
            const { error, value } = filesSchema.validate(files);
            expect(value).toStrictEqual(files);
            expect(error).toBeUndefined();
        });
    });

    describe('fails when', () => {
        it('manuscript missing', () => {
            files.manuscriptFile = null;
            const { error } = filesSchema.validate(files);
            expect(error?.message).toEqual('"manuscriptFile" must be of type object');
        });
        it('manuscript not stored', () => {
            if (files.manuscriptFile) {
                files.manuscriptFile.status = 'CREATED';
            }
            const { error } = filesSchema.validate(files);
            expect(error?.message).toEqual('"manuscriptFile.status" must be [STORED]');
        });
    });
});
