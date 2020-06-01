import File from './file';
import { FileType, FileId, FileStatus } from '../../types';
import { SubmissionId } from '../../../submission/types';

describe('File', () => {
    const mockFileId = FileId.fromUuid('cc65c0c1-233d-4a3f-bdd5-eaf0f4e05b33');
    const mockSubmissionId = SubmissionId.fromUuid('281f30ba-af2c-40cf-8ad1-e62dd2a9a245');
    const mockFile = {
        id: mockFileId,
        submissionId: mockSubmissionId,
        mimeType: 'mimeType',
        filename: 'filename',
        status: 'status',
        size: 0,
        type: FileType.MANUSCRIPT_SOURCE,
    };

    it('constructs File with minimum fields', () => {
        const file = new File(mockFile);
        expect(file).not.toBeNull();
        expect(file).toMatchObject(mockFile);
    });

    it('generates url for manuscript', () => {
        const file = new File(mockFile);
        expect(file).not.toBeNull();
        expect(file.url).toBe(`manuscripts/${mockSubmissionId}/${mockFileId}`);
    });

    it('constructs File with date fields', () => {
        const mockDate = new Date();
        const tmp = { ...mockFile, created: mockDate, updated: mockDate };
        tmp.created = mockDate;
        tmp.updated = mockDate;

        const file = new File(tmp);
        expect(file).not.toBeNull();
        expect(file.url).toBe(`manuscripts/${mockSubmissionId}/${mockFileId}`);
        expect(file).toMatchObject(tmp);
    });

    it('generates url for supporting files', () => {
        const tmp = { ...mockFile };
        tmp.type = FileType.SUPPORTING_FILE;
        const file = new File(tmp);
        expect(file).not.toBeNull();
        expect(file.url).toBe(`supporting/${mockSubmissionId}/${mockFileId}`);
    });

    it('isCancelled returns true only when cancelled', () => {
        for (const item in FileStatus) {
            const tmp = { ...mockFile };
            tmp.status = item;
            const file = new File(tmp);
            if (item == FileStatus.CANCELLED) {
                expect(file.isCancelled()).toBe(true);
            } else {
                expect(file.isCancelled()).toBe(false);
            }
        }
    });

    it('isDeleted returns true only when deleted', () => {
        for (const item in FileStatus) {
            const tmp = { ...mockFile };
            tmp.status = item;
            const file = new File(tmp);
            if (item == FileStatus.DELETED) {
                expect(file.isDeleted()).toBe(true);
            } else {
                expect(file.isDeleted()).toBe(false);
            }
        }
    });
});
