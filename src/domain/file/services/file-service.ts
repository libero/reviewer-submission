import * as Knex from 'knex';
import uuid from 'uuid';
import S3 from 'aws-sdk/clients/s3';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubFileRepository from '../repositories/xpub-file';
import { FileId, FileType, FileStatus } from '../types';
import File from './models/file';
import { SubmissionId } from '../../../domain/submission/types';

// TODO: configure properly.
const s3 = new S3({
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
});

export class FileService {
    fileRepository: XpubFileRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.fileRepository = new XpubFileRepository(adapter);
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
        return s3
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
