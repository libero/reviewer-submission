import * as Knex from 'knex';
import { v4 as uuid } from 'uuid';
import * as S3 from 'aws-sdk/clients/s3';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubFileRepository from '../repositories/xpub-file';
import { FileId, FileType, FileStatus } from '../types';
import File from './models/file';
import { SubmissionId } from '../../../domain/submission/types';
import { S3Config } from '../../../config';
import { PubSub } from 'apollo-server-express';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError } from 'aws-sdk/lib/error';
import { response } from 'express';

export class FileService {
    fileRepository: XpubFileRepository;
    s3: S3;
    bucket: string;

    constructor(knex: Knex<{}, unknown[]>, s3config: S3Config) {
        const adapter = createKnexAdapter(knex, 'public');
        this.fileRepository = new XpubFileRepository(adapter);
        const defaultOptions = {
            accessKeyId: s3config.accessKeyId,
            secretAccessKey: s3config.secretAccessKey,
            apiVersion: '2006-03-01',
            signatureVersion: 'v4',
            s3ForcePathStyle: s3config.s3ForcePathStyle,
        };
        const s3Options = s3config.awsEndPoint ? { ...defaultOptions, endpoint: s3config.awsEndPoint } : defaultOptions;
        this.bucket = s3config.fileBucket;
        this.s3 = new S3(s3Options);
    }

    private getFileS3Key(fileType: FileType, submissionId: SubmissionId, fileId: FileId): string {
        switch (fileType) {
            case FileType.MANUSCRIPT_SOURCE:
                return `manuscripts/${submissionId}/${fileId}`;
            case FileType.SUPPORTING_FILE:
                return `supporting/${submissionId}/${fileId}`;
            default:
                throw new Error('Invalid FileType');
        }
    }

    async handleMultipartChunk(
        userId: string,
        file: File,
        chunk: any,
        partNumber: number,
        s3Stuff: PromiseResult<S3.CreateMultipartUploadOutput, AWSError>,
        pubsub: PubSub,
        bytesRead: number,
        numAttempts = 0,
    ): Promise<void> {
        if (numAttempts >= 3) {
            throw new Error(`Error uploading chunk no: ${partNumber}`);
        }
        if (!s3Stuff.UploadId) {
            throw new Error('no upload id');
        }
        const partParams = {
            Body: chunk,
            Bucket: s3Stuff.Bucket || this.bucket,
            Key: s3Stuff.Key || file.url,
            PartNumber: partNumber,
            UploadId: s3Stuff.UploadId,
            ContentLength: chunk.length,
        };

        try {
            await this.s3.uploadPart(partParams).promise();
        } catch (e) {
            console.log('+++++++++');

            await this.handleMultipartChunk(
                userId,
                file,
                chunk,
                partNumber,
                s3Stuff,
                pubsub,
                bytesRead,
                numAttempts + 1,
            );
        }

        await pubsub.publish('UPLOAD_STATUS', {
            manuscriptUploadProgress: {
                userId,
                filename: file.filename,
                fileId: file.id,
                percentage: Math.floor((bytesRead / file.size) * 100),
            },
        });
    }

    async completeMultipartUpload(
        key: string,
        uploadId: string,
    ): Promise<PromiseResult<S3.Types.CompleteMultipartUploadOutput, AWSError>> {
        return this.s3
            .completeMultipartUpload({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
            })
            .promise();
    }

    async deleteManuscript(fileId: FileId, submissionId: SubmissionId): Promise<boolean> {
        await this.fileRepository.deleteByIdAndSubmissionId(fileId, submissionId);
        await this.s3.deleteObject({
            Bucket: this.bucket,
            Key: this.getFileS3Key(FileType.MANUSCRIPT_SOURCE, submissionId, fileId),
        });
        return true;
    }

    async deleteSupportingFile(fileId: FileId, submissionId: SubmissionId): Promise<boolean> {
        await this.fileRepository.deleteByIdAndSubmissionId(fileId, submissionId);
        await this.s3.deleteObject({
            Bucket: this.bucket,
            Key: this.getFileS3Key(FileType.SUPPORTING_FILE, submissionId, fileId),
        });
        return true;
    }

    async create(
        submissionId: SubmissionId,
        filename: string,
        mimeType: string,
        size: number,
        type: FileType,
    ): Promise<File> {
        if (type === FileType.MANUSCRIPT_SOURCE) {
            const hasFile = await this.hasManuscriptFile(submissionId);
            if (hasFile === true) {
                throw new Error('Submission already has manuscript');
            }
        }
        const id = FileId.fromUuid(uuid());
        const status = FileStatus.CREATED;
        const currentDate = new Date();
        const file = new File({
            id,
            submissionId,
            created: currentDate,
            updated: currentDate,
            type,
            filename,
            mimeType,
            size,
            status,
        });
        return await this.fileRepository.create(file);
    }

    async update(file: File): Promise<File> {
        return this.fileRepository.update(file);
    }

    async findManuscriptFile(submissionId: SubmissionId): Promise<File | null> {
        const file = await this.fileRepository.findManuscriptBySubmissionId(submissionId);
        if (!file) {
            return null;
        }

        this.addDownloadLink(file);

        return file;
    }

    async hasManuscriptFile(submissionId: SubmissionId): Promise<boolean> {
        const file = await this.fileRepository.findManuscriptBySubmissionId(submissionId);
        return file !== null;
    }

    async getSupportingFiles(submissionId: SubmissionId): Promise<Array<File>> {
        const supportingFiles = await this.fileRepository.getSupportingFilesBySubmissionId(submissionId);

        return supportingFiles.map(
            (file): File => {
                this.addDownloadLink(file);

                return file;
            },
        );
    }

    async uploadManuscript(
        // fileContents: Buffer,
        file: File,
        // userId: string,
        // pubsub: PubSub,
    ): Promise<PromiseResult<S3.CreateMultipartUploadOutput, AWSError>> {
        const { url, id, mimeType } = file;
        const fileUploadManager = this.s3.createMultipartUpload({
            Bucket: this.bucket,
            Key: `${url}/${id}`,
            ContentType: mimeType,
            ACL: 'private',
        });

        // fileUploadManager.on('httpUploadProgress', async ({ loaded, total }) => {
        //     await pubsub.publish('UPLOAD_STATUS', {
        //         manuscriptUploadProgress: {
        //             userId,
        //             filename: file.filename,
        //             fileId: file.id,
        //             percentage: Math.floor((loaded / total) * 100),
        //         },
        //     });
        // });

        return fileUploadManager.promise();
    }

    async uploadSupportingFile(
        fileContents: Buffer,
        file: File,
        userId: string,
        pubsub: PubSub,
    ): Promise<S3.CreateMultipartUploadOutput> {
        const { url, id, mimeType } = file;
        const fileUploadManager = this.s3.createMultipartUpload({
            Bucket: this.bucket,
            Key: `${url}/${id}`,
            // Body: fileContents.toString(),
            ContentType: mimeType,
            ACL: 'private',
        });

        // fileUploadManager.on('httpUploadProgress', async ({ loaded, total }) => {
        //     await pubsub.publish('UPLOAD_STATUS', {
        //         supportingUploadProgress: {
        //             userId,
        //             filename: file.filename,
        //             fileId: file.id,
        //             percentage: Math.floor((loaded / total) * 100),
        //         },
        //     });
        // });

        return fileUploadManager.promise();
    }

    private addDownloadLink(file: File): void {
        const downloadLink = this.s3.getSignedUrl('getObject', {
            Bucket: this.bucket,
            Key: file.url,
        });

        file.downloadLink = downloadLink;
    }
}
