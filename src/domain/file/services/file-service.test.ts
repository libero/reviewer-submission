import XpubFileRepository from '../repositories/xpub-file';
import { v4 } from 'uuid';
import Knex = require('knex');
import { SubmissionId } from '../../submission/types';
import { FileDTO } from '../repositories/types';
import { FileId, FileType } from '../types';
import { FileService } from './file-service';
import { S3Config } from '../../../config';
import * as S3 from 'aws-sdk/clients/s3';

const submissionId = v4();
const files: FileDTO[] = [
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
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('create', () => {
        it('should throw is manuscript already exists', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(files);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config);
            await expect(
                service.create(SubmissionId.fromUuid(submissionId), '', '', 0, FileType.MANUSCRIPT_SOURCE),
            ).rejects.toThrow();
        });

        it('should create if no manuscript exists', async () => {
            XpubFileRepository.prototype.findManuscriptBySubmissionId = jest.fn().mockReturnValue(null);
            XpubFileRepository.prototype.create = jest.fn().mockReturnValue(files[0]);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config);
            const result = await service.create(
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
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config);
            const result = await service.create(
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
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config);
            const result = await service.create(
                SubmissionId.fromUuid(submissionId),
                '',
                '',
                0,
                FileType.SUPPORTING_FILE,
            );
            expect(result.url).toBe(`supporting/${submissionId}/${result.id}`);
        });
    });

    describe('deleteManuscript', () => {
        it('should delete manuscript', async () => {
            const fileId = v4();
            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockReturnValue(
                    Promise.resolve(({ id: fileId, url: `manuscripts/${submissionId}` } as unknown) as FileDTO),
                );
            const deleteByIdAndSubmissionIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'deleteByIdAndSubmissionId')
                .mockReturnValueOnce(Promise.resolve(true));

            S3.prototype.deleteObject = jest.fn().mockImplementationOnce(() => true);
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config);
            const result = await service.deleteManuscript(FileId.fromUuid(fileId), SubmissionId.fromUuid(submissionId));
            expect(result).toBeTruthy();

            findFileByIdSpy.mockRestore();
            deleteByIdAndSubmissionIdSpy.mockRestore();
        });

        it('should throw if manuscript not found', async () => {
            const findFileByIdSpy = jest
                .spyOn(XpubFileRepository.prototype, 'findFileById')
                .mockImplementation(() => Promise.resolve(null));
            const service = new FileService((null as unknown) as Knex, ({} as unknown) as S3Config);
            const fileId = v4();
            await expect(
                service.deleteManuscript(FileId.fromUuid(fileId), SubmissionId.fromUuid(submissionId)),
            ).rejects.toThrow();

            findFileByIdSpy.mockRestore();
        });
    });
});
