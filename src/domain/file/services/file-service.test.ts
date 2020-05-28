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
const files = [
    {
        id: FileId.fromUuid(v4()),
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
    const mockAudit: Auditor = {
        recordAudit: jest.fn(),
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
        it('should throw is manuscript already exists', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(files);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            await expect(
                service.create(mockUser, SubmissionId.fromUuid(submissionId), '', '', 0, FileType.MANUSCRIPT_SOURCE),
            ).rejects.toThrow();
        });

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
            expect(result?.downloadLink).toEqual(downloadLink);
        });
    });

    describe('deleteManuscript', () => {
        it('should delete manuscript', async () => {
            const fileId = v4();
            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockReturnValue(Promise.resolve(new File(files[0])));
            const deleteByIdAndSubmissionIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'deleteByIdAndSubmissionId')
                .mockReturnValueOnce(Promise.resolve(true));

            S3.prototype.deleteObject = jest.fn().mockImplementationOnce(() => true);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config, mockAudit);
            const result = await service.deleteManuscript(
                mockUser,
                FileId.fromUuid(fileId),
                SubmissionId.fromUuid(submissionId),
            );
            expect(result).toBeTruthy();

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
