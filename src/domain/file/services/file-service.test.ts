import XpubFileRepository from '../repositories/xpub-file';
import { v4 } from 'uuid';
import Knex from 'knex';
import { SubmissionId } from '../../submission/types';
import { FileId, FileType } from '../types';
import { FileService } from './file-service';
import { S3Config } from '../../../config';
import * as S3 from 'aws-sdk/clients/s3';
import File from '../services/models/file';
import { Auditor } from '../../audit/types';

const submissionId = v4();
const firstFileId = FileId.fromUuid('cc65c0c1-233d-4a3f-bdd5-eaf0f4e05b33');
const files = [
    {
        id: firstFileId,
        submissionId: SubmissionId.fromUuid(submissionId),
        url: '',
        mimeType: '',
        filename: '',
        status: '',
        size: 0,
        type: FileType.MANUSCRIPT_SOURCE,
    },
];

jest.mock('aws-sdk/clients/s3');

describe('File Service', () => {
    const mockRecordAudit = jest.fn();
    const mockAudit: Auditor = {
        recordAudit: mockRecordAudit,
    };
    const mockUser = {
        id: '72ef483e-8975-4d94-99a1-dc00c2dae519',
        name: 'Bob',
        role: 'user',
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('create', () => {
        it('should create if no manuscript exists', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(null);
            XpubFileRepository.prototype.create = jest.fn().mockReturnValue(files[0]);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            const result = await service.create(
                mockUser,
                SubmissionId.fromUuid(submissionId),
                '',
                '',
                0,
                FileType.MANUSCRIPT_SOURCE,
            );
            expect(result).toBeTruthy();
        });

        it('should create correct url for manuscript', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(null);
            XpubFileRepository.prototype.create = jest.fn().mockImplementationOnce(file => file);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            const result = await service.create(
                mockUser,
                SubmissionId.fromUuid(submissionId),
                '',
                '',
                0,
                FileType.MANUSCRIPT_SOURCE,
            );
            expect(result.url).toBe(`manuscripts/${submissionId}/${result.id}`);
        });

        it('should create correct url for supporting file', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(null);
            XpubFileRepository.prototype.create = jest.fn().mockImplementationOnce(file => file);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            const result = await service.create(
                mockUser,
                SubmissionId.fromUuid(submissionId),
                '',
                '',
                0,
                FileType.SUPPORTING_FILE,
            );
            expect(result.url).toBe(`supporting/${submissionId}/${result.id}`);
        });
    });

    describe('getSupportingFiles', () => {
        it('should set download link', async () => {
            XpubFileRepository.prototype.getSupportingFilesBySubmissionId = jest
                .fn()
                .mockReturnValue([{ ...files[0] }]);
            const downloadLink = 'http://s3/download/link';
            S3.prototype.getSignedUrl = jest.fn().mockReturnValue(downloadLink);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            const result = await service.getSupportingFiles(SubmissionId.fromUuid(submissionId));

            expect(result[0].downloadLink === downloadLink);
            expect(result[0].id === firstFileId);
        });
    });

    describe('findManuscriptFile', () => {
        it('should set download link', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue({ ...files[0] });
            const downloadLink = 'http://s3/download/link';
            S3.prototype.getSignedUrl = jest.fn().mockReturnValue(downloadLink);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            const result = await service.findManuscriptFile(SubmissionId.fromUuid(submissionId));

            expect(result).toBeTruthy();
            expect(result?.id).toBe(firstFileId);
            expect(result?.downloadLink).toEqual(downloadLink);
        });
    });

    describe('deleteManuscript', () => {
        it('should delete manuscript', async () => {
            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockReturnValue(Promise.resolve(new File(files[0])));
            const deleteByIdAndSubmissionIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'deleteByIdAndSubmissionId')
                .mockReturnValueOnce(Promise.resolve(true));

            S3.prototype.deleteObject = jest.fn().mockImplementationOnce(() => true);
            const update = jest.fn();
            FileService.prototype.update = update;
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);

            const result = await service.deleteManuscript(mockUser, firstFileId, SubmissionId.fromUuid(submissionId));

            expect(result).toBeTruthy();
            expect(mockRecordAudit.mock.calls[0][0]).toMatchObject({
                action: 'UPDATED',
                objectId: firstFileId,
                objectType: 'MANUSCRIPT_SOURCE',
                userId: mockUser.id,
                value: 'DELETED',
            });
            expect(update).toHaveBeenCalledWith({
                created: undefined,
                filename: '',
                id: firstFileId,
                mimeType: '',
                size: 0,
                status: 'DELETED',
                submissionId: submissionId,
                type: 'MANUSCRIPT_SOURCE',
                updated: undefined,
                url: `manuscripts/${submissionId}/${firstFileId}`,
            });

            findFileByIdSpy.mockRestore();
            deleteByIdAndSubmissionIdSpy.mockRestore();
        });

        it('should throw if manuscript not found', async () => {
            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockImplementation(() => Promise.resolve(null));
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            const fileId = v4();
            await expect(
                service.deleteManuscript(mockUser, FileId.fromUuid(fileId), SubmissionId.fromUuid(submissionId)),
            ).rejects.toThrow();

            findFileByIdSpy.mockRestore();
        });
    });
});
