/* eslint-disable @typescript-eslint/camelcase */
import { createMockAdapter, MockKnex } from '../../test-mocks/knex-mock';
import { KnexTableAdapter } from '../../knex-table-adapter';
import XpubFileRepository from './xpub-file';
import File from '../services/models/file';
import { FileType, FileId, FileStatus } from '../types';
import { SubmissionId } from '../../submission/types';

describe('XpubFileRepository', () => {
    let adapter: KnexTableAdapter;
    let mock: MockKnex;
    let mockFile: File;
    const mockFileId = FileId.fromUuid('cc65c0c1-233d-4a3f-bdd5-eaf0f4e05b33');
    const mockSubmissionId = SubmissionId.fromUuid('281f30ba-af2c-40cf-8ad1-e62dd2a9a245');

    beforeEach(() => {
        jest.resetAllMocks();
        mock = new MockKnex();
        adapter = createMockAdapter(mock);
        mockFile = new File({
            id: mockFileId,
            submissionId: mockSubmissionId,
            mimeType: 'mimeType',
            filename: 'filename',
            status: 'status',
            size: 0,
            type: FileType.MANUSCRIPT_SOURCE,
        });
    });

    describe('create', (): void => {
        it('inserts into file table using knex', async (): Promise<void> => {
            const repo = new XpubFileRepository(adapter);
            const expected = {
                created: undefined,
                filename: 'filename',
                id: `${mockFileId}`,
                manuscript_id: `${mockSubmissionId}`,
                mime_type: 'mimeType',
                size: 0,
                status: 'status',
                type: 'MANUSCRIPT_SOURCE',
                updated: undefined,
                url: `manuscripts/${mockSubmissionId}/${mockFileId}`,
            };
            const returnFile = await repo.create(mockFile);
            expect(mock.into).toBeCalledWith('file');
            expect(mock.insert).toBeCalledWith(expected);
            expect(returnFile).toStrictEqual(mockFile);
        });
    });

    describe('findFileById', () => {
        it('returns null when no file exists', async () => {
            const repo = new XpubFileRepository(adapter);
            const returnFile = await repo.findFileById(FileId.fromUuid('378407f2-5e12-417d-baff-847c8766bb24'));
            expect(mock.select).toHaveBeenCalled();
            expect(mock.from).toBeCalledWith('file');
            expect(returnFile).toBeNull();
        });
        it('returns a File when found', async () => {
            const repo = new XpubFileRepository(adapter);
            adapter.executor = jest.fn().mockReturnValue([repo.modelToEntry(mockFile)]);

            const returnFile = await repo.findFileById(mockFileId);
            expect(mock.select).toHaveBeenCalled();
            expect(mock.from).toBeCalledWith('file');
            expect(adapter.executor).toHaveBeenCalled();
            expect(returnFile).not.toBeNull();
            expect(returnFile).toStrictEqual(mockFile);
        });
    });

    describe('findManuscriptBySubmissionId', () => {
        it('returns null when no file exists', async () => {
            const repo = new XpubFileRepository(adapter);
            const returnFile = await repo.findManuscriptBySubmissionId(
                SubmissionId.fromUuid('378407f2-5e12-417d-baff-847c8766bb24'),
            );
            expect(mock.from).toBeCalledWith('file');
            expect(mock.select).toHaveBeenCalled();
            expect(returnFile).toBeNull();
        });
        it('returns a File when found', async () => {
            const repo = new XpubFileRepository(adapter);
            adapter.executor = jest.fn().mockReturnValue([repo.modelToEntry(mockFile)]);

            const returnFile = await repo.findManuscriptBySubmissionId(mockSubmissionId);
            expect(adapter.executor).toHaveBeenCalled();
            expect(mock.select).toHaveBeenCalled();
            expect(mock.from).toBeCalledWith('file');
            expect(mock.where).toHaveBeenCalledWith({
                manuscript_id: mockSubmissionId,
                type: FileType.MANUSCRIPT_SOURCE,
                status: FileStatus.STORED,
            });
            expect(returnFile).not.toBeNull();
            expect(returnFile).toStrictEqual(mockFile);
        });
        it('throws if more than one File is found', async () => {
            const repo = new XpubFileRepository(adapter);
            const files = [repo.modelToEntry(mockFile), repo.modelToEntry(mockFile)];
            adapter.executor = jest.fn().mockReturnValue(files);

            await expect(repo.findManuscriptBySubmissionId(mockSubmissionId)).rejects.toThrow(
                `Too many manuscripts on submission: [\n    \"${mockFileId}\",\n    \"${mockFileId}\"\n]`,
            );
        });
    });

    describe('getSupportingFilesBySubmissionId', () => {
        beforeEach(() => {
            mockFile.type = FileType.SUPPORTING_FILE;
            mockFile = new File(mockFile);
        });

        it('returns [] when no file(s) exists', async () => {
            const repo = new XpubFileRepository(adapter);
            const returnFile = await repo.getSupportingFilesBySubmissionId(
                SubmissionId.fromUuid('378407f2-5e12-417d-baff-847c8766bb24'),
            );
            expect(mock.select).toHaveBeenCalled();
            expect(mock.from).toBeCalledWith('file');
            expect(mock.where).toBeCalledWith({
                manuscript_id: '378407f2-5e12-417d-baff-847c8766bb24',
                type: FileType.SUPPORTING_FILE,
                status: FileStatus.STORED,
            });
            expect(returnFile).toStrictEqual([]);
        });
        it('returns a File when found', async () => {
            const repo = new XpubFileRepository(adapter);
            adapter.executor = jest.fn().mockReturnValue([repo.modelToEntry(mockFile)]);

            const returnFile = await repo.getSupportingFilesBySubmissionId(mockSubmissionId);

            expect(adapter.executor).toHaveBeenCalled();
            expect(mock.select).toHaveBeenCalled();
            expect(mock.where).toHaveBeenCalledWith({
                manuscript_id: mockSubmissionId,
                type: FileType.SUPPORTING_FILE,
                status: FileStatus.STORED,
            });
            expect(returnFile).not.toBeNull();
            expect(returnFile).toStrictEqual([mockFile]);
        });
    });
});
