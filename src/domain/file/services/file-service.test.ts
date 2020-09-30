import * as fs from 'fs';
import XpubFileRepository from '../repositories/xpub-file';
import { v4 } from 'uuid';
import Knex from 'knex';
import { SubmissionId } from '../../submission/types';
import { FileId, FileType, FileStatus } from '../types';
import { FileService } from './file-service';
import File from '../services/models/file';
import { Auditor } from '../../audit/types';
import { PubSub } from 'apollo-server-express';
import S3 from 'aws-sdk/clients/s3';
jest.mock('aws-sdk/clients/s3');

const submissionId = v4();
const firstFileId = FileId.fromUuid('cc65c0c1-233d-4a3f-bdd5-eaf0f4e05b33');
const secondFileId = FileId.fromUuid('cd65c0c1-233d-4a3f-bdd5-daf0f4e05b43');
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
    {
        id: secondFileId,
        submissionId: SubmissionId.fromUuid(submissionId),
        url: '',
        mimeType: '',
        filename: '',
        status: '',
        size: 0,
        type: FileType.SUPPORTING_FILE,
    },
];

const mockRecordAudit = jest.fn();
const mockAudit: Auditor = {
    recordAudit: mockRecordAudit,
};
const mockPubSub = ({ publish: jest.fn() } as unknown) as PubSub;

const mockUser = {
    id: '72ef483e-8975-4d94-99a1-dc00c2dae519',
    name: 'Bob',
    role: 'user',
};

const mockFileUploadManager = {
    promise: jest.fn().mockReturnValue(0),
    UploadId: 'abc123',
};
const downloadLink = 'http://s3/download/link';
const createMultipartUpload = jest.fn();
const mockS3 = {
    createMultipartUpload: createMultipartUpload.mockReturnValue(mockFileUploadManager),
    completeMultipartUpload: jest.fn().mockReturnValue(mockFileUploadManager),
    getSignedUrl: jest.fn().mockReturnValue(downloadLink),
    deleteObject: jest.fn().mockReturnValue({
        promise: jest.fn(),
    }),
};

describe('File Service', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        mockRecordAudit.mockReset();
    });

    describe('create', () => {
        it('should create and audit if no manuscript exists', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(null);
            XpubFileRepository.prototype.create = jest.fn().mockReturnValue(files[0]);
            XpubFileRepository.prototype.update = jest.fn();
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);
            const result = await service.create(
                mockUser,
                SubmissionId.fromUuid(submissionId),
                '',
                '',
                0,
                FileType.MANUSCRIPT_SOURCE,
            );
            expect(result).toBeTruthy();
            expect(mockAudit.recordAudit).toHaveBeenCalled();
            expect(mockRecordAudit.mock.calls[0][0]).toMatchObject({
                action: 'UPDATED',
                objectType: 'MANUSCRIPT_SOURCE',
                userId: mockUser.id,
                value: 'CREATED',
            });
        });
    });

    describe('getSupportingFiles', () => {
        it('should set download link', async () => {
            XpubFileRepository.prototype.getSupportingFilesBySubmissionId = jest
                .fn()
                .mockReturnValue([{ ...files[0] }]);

            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);
            const result = await service.getSupportingFiles(SubmissionId.fromUuid(submissionId));

            expect(result[0].downloadLink === downloadLink);
            expect(result[0].id === firstFileId);
            expect(mockS3.getSignedUrl).toHaveBeenCalled();
        });
    });

    describe('findManuscriptFile', () => {
        it('should set download link', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue({ ...files[0] });
            const downloadLink = 'http://s3/download/link';
            mockS3.getSignedUrl = jest.fn().mockReturnValue(downloadLink);
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);
            const result = await service.findManuscriptFile(SubmissionId.fromUuid(submissionId));

            expect(result).toBeTruthy();
            expect(result?.id).toBe(firstFileId);
            expect(result?.downloadLink).toEqual(downloadLink);
            expect(mockS3.getSignedUrl).toHaveBeenCalled();
        });
    });

    describe('deleteManuscript', () => {
        it('should delete manuscript', async () => {
            expect(mockAudit.recordAudit).toHaveBeenCalledTimes(0);

            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockReturnValue(Promise.resolve(new File(files[0])));

            const update = jest.fn();
            FileService.prototype.update = update;
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);

            const result = await service.deleteManuscript(mockUser, firstFileId, SubmissionId.fromUuid(submissionId));

            expect(result).toBeTruthy();
            expect(mockAudit.recordAudit).toHaveBeenCalled();
            expect(mockS3.deleteObject).toHaveBeenCalled();
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
        });

        it('should throw if manuscript not found', async () => {
            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockImplementation(() => Promise.resolve(null));
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);
            const fileId = FileId.fromUuid('18f0d56a-600c-4007-b140-f3de9acf5ff9');
            await expect(
                service.deleteManuscript(mockUser, fileId, SubmissionId.fromUuid(submissionId)),
            ).rejects.toThrow('Unable to find entry with id: 18f0d56a-600c-4007-b140-f3de9acf5ff9');

            findFileByIdSpy.mockRestore();
        });
    });

    describe('deleteFilesForSubmission', () => {
        it('should delete manuscript', async () => {
            expect(mockAudit.recordAudit).toHaveBeenCalledTimes(0);

            const findManuscriptBySubmissionIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findManuscriptBySubmissionId')
                .mockReturnValue(Promise.resolve(new File(files[0])));

            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockReturnValue(Promise.resolve(new File(files[0])));

            const getSupportingFilesBySubmissionIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'getSupportingFilesBySubmissionId')
                .mockReturnValue(Promise.resolve([new File(files[1])]));

            const update = jest.fn();
            FileService.prototype.update = update;
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);

            await service.deleteFilesForSubmission(mockUser, SubmissionId.fromUuid(submissionId));

            expect(findManuscriptBySubmissionIdSpy).toBeCalledWith(SubmissionId.fromUuid(submissionId));
            expect(findFileByIdSpy).toHaveBeenNthCalledWith(1, new File(files[0]).id);
            expect(findFileByIdSpy).toHaveBeenNthCalledWith(2, new File(files[1]).id);
            expect(getSupportingFilesBySubmissionIdSpy).toHaveBeenCalledWith(SubmissionId.fromUuid(submissionId));

            findFileByIdSpy.mockRestore();
        });
    });

    describe('hasManuscriptFile', () => {
        it('returns false when submission does not exist', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(null);

            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);
            const result = await service.hasManuscriptFile(
                SubmissionId.fromUuid('091dcef8-f6ee-46ef-a5c1-cdee1b9c1641'),
            );
            expect(result).toBe(false);
        });
        it('returns true when submission has a manuscript', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue({ ...files[0] });

            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);
            const result = await service.hasManuscriptFile(
                SubmissionId.fromUuid('091dcef8-f6ee-46ef-a5c1-cdee1b9c1641'),
            );
            expect(result).toBe(true);
        });
    });

    describe('uploadManuscript', () => {
        it('returns the file contents', async () => {
            XpubFileRepository.prototype.update = jest.fn();
            const file = new File(files[0]);
            file.status = FileStatus.CREATED;
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);

            const result = await service.uploadManuscript(
                file,
                fs.createReadStream('./package.json'),
                mockUser.id,
                mockPubSub,
                files[0].submissionId,
            );

            expect(result).not.toBeNull();
            expect(result.toString()).toContain('"name": "reviewer-submission"');
        });

        it('calls to pubsub', async () => {
            XpubFileRepository.prototype.update = jest.fn();
            const file = new File(files[0]);
            file.status = FileStatus.CREATED;
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);

            await service.uploadManuscript(
                file,
                fs.createReadStream('./package.json'),
                mockUser.id,
                mockPubSub,
                files[0].submissionId,
            );
            expect(mockPubSub.publish).toHaveBeenCalledWith('UPLOAD_STATUS', {
                fileUploadProgress: {
                    fileId: 'cc65c0c1-233d-4a3f-bdd5-eaf0f4e05b33',
                    filename: '',
                    percentage: Infinity,
                    submissionId: `${file.submissionId}`,
                    type: 'MANUSCRIPT_SOURCE',
                    userId: '72ef483e-8975-4d94-99a1-dc00c2dae519',
                },
            });
        });

        it('calls S3 Upload functions', async () => {
            XpubFileRepository.prototype.update = jest.fn();
            const file = new File(files[0]);
            file.status = FileStatus.CREATED;
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);

            await service.uploadManuscript(
                file,
                fs.createReadStream('./package.json'),
                mockUser.id,
                mockPubSub,
                files[0].submissionId,
            );

            expect(createMultipartUpload).toHaveBeenCalled();
            expect(createMultipartUpload.mock.calls[0][0]).toMatchObject({
                Bucket: 'bucket',
                Key: `manuscripts/${submissionId}/${file.id}`,
            });
            expect(mockS3.completeMultipartUpload).toHaveBeenCalled();
            expect(mockS3.completeMultipartUpload).toHaveBeenCalledWith({
                Bucket: 'bucket',
                Key: `manuscripts/${file.submissionId}/${file.id}`,
                MultipartUpload: { Parts: [] },
                UploadId: '',
            });
        });

        it('audits the upload and file is stored', async () => {
            XpubFileRepository.prototype.update = jest.fn();
            const file = new File(files[0]);
            file.status = FileStatus.CREATED;
            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);

            await service.uploadManuscript(
                file,
                fs.createReadStream('./package.json'),
                mockUser.id,
                mockPubSub,
                files[0].submissionId,
            );

            expect(mockAudit.recordAudit).toHaveBeenCalled();
            expect(mockRecordAudit.mock.calls[0][0]).toMatchObject({
                action: 'UPDATED',
                objectType: 'MANUSCRIPT_SOURCE',
                userId: mockUser.id,
                value: 'STORED',
            });
            expect(file.status).toBe(FileStatus.STORED);
        });

        it('when unsuccessful it has been cancelled and audited', async () => {
            XpubFileRepository.prototype.update = jest.fn();
            const file = new File(files[0]);
            file.status = FileStatus.CREATED;
            mockS3.completeMultipartUpload.mockImplementation(() => {
                throw new Error('some random error');
            });

            const service = new FileService((null as unknown) as Knex, (mockS3 as unknown) as S3, 'bucket', mockAudit);

            await service.uploadManuscript(
                file,
                fs.createReadStream('./package.json'),
                mockUser.id,
                mockPubSub,
                files[0].submissionId,
            );

            expect(mockAudit.recordAudit).toHaveBeenCalled();
            expect(mockRecordAudit.mock.calls[0][0]).toMatchObject({
                action: 'UPDATED',
                objectType: 'MANUSCRIPT_SOURCE',
                userId: mockUser.id,
                value: 'CANCELLED',
            });
            expect(file.status).toBe(FileStatus.CANCELLED);
        });
    });
});
