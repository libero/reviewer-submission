import * as Knex from 'knex';
import uuid from 'uuid';
import * as S3 from 'aws-sdk/clients/s3';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubFileRepository from '../repositories/xpub-file';
import { FileId, FileType, FileStatus } from '../types';
import File from './models/file';
import { SubmissionId } from '../../../domain/submission/types';
import { S3Config } from '../../../config';

export class FileService {
    fileRepository: XpubFileRepository;
    s3: S3;

    constructor(knex: Knex<{}, unknown[]>, s3config: S3Config) {
        const adapter = createKnexAdapter(knex, 'public');
        this.fileRepository = new XpubFileRepository(adapter);
        const defaultOptions = {
            params: {
                Bucket: s3config.fileBucket,
            },
            accessKeyId: s3config.accessKeyId,
            secretAccessKey: s3config.secretAccessKey,
            apiVersion: '2006-03-01',
            signatureVersion: 'v4',
        };
        const s3Options = s3config.awsEndPoint ? { ...defaultOptions, endpoint: s3config.awsEndPoint } : defaultOptions;
        this.s3 = new S3(s3Options);
    }

    async create(
        submissionId: SubmissionId,
        filename: string,
        mimeType: string,
        size: number,
        type: FileType,
    ): Promise<File> {
        const id = FileId.fromUuid(uuid());
        const status = FileStatus.CREATED;
        const url = `manuscripts/${submissionId}`;
        const newFile = await this.fileRepository.create({
            id,
            submissionId,
            filename,
            mimeType,
            size,
            type,
            status,
            url,
        });

        return new File(newFile);
    }

    async upload(fileContents: Buffer, file: File): Promise<S3.ManagedUpload.SendData> {
        const { url, id, mimeType, size } = file;
        return this.s3
            .upload({
                Bucket: 'config.bucket', // TODO: use config.
                Key: `${url}/${id}`,
                Body: fileContents,
                ContentType: mimeType,
                ContentLength: size,
                ACL: 'private',
            })
            .promise();
    }
}
