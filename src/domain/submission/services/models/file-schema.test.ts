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
            const { error, value } = fileSchema.validate(file);
            expect(value).toStrictEqual(file);
            expect(error).toBeUndefined();
        });
    });
    describe('fails when', () => {
        it('file not stored', () => {
            file.status = 'CREATED';
            const { error } = fileSchema.validate(file);
            expect(error?.message).toEqual('"status" must be [STORED]');
        });
    });
});
