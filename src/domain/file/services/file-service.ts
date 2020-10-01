import * as Knex from 'knex';
import { v4 as uuid } from 'uuid';
import * as S3 from 'aws-sdk/clients/s3';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubFileRepository from '../repositories/xpub-file';
import { FileId, FileType, FileStatus } from '../types';
import File from './models/file';
import { SubmissionId } from '../../../domain/submission/types';
import { PubSub } from 'apollo-server-express';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError } from 'aws-sdk/lib/error';
import { ReadStream } from 'fs';
import { Auditor, AuditId, ObjectId, UserId, AuditAction } from '../../audit/types';
import { User } from 'src/domain/user/user';
import { InfraLogger as logger } from '../../../logger';

const s3MinChunkSize = 5 * 1024 * 1024; // at least 5MB (non rounded)

export class FileService {
    fileRepository: XpubFileRepository;
    s3: S3;
    auditService: Auditor;
    bucket: string;

    constructor(knex: Knex<{}, unknown[]>, s3: S3, bucket: string, auditService: Auditor) {
        const adapter = createKnexAdapter(knex, 'public');
        this.fileRepository = new XpubFileRepository(adapter);
        this.bucket = bucket;
        this.s3 = s3;
        this.auditService = auditService;
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
        pubsub: PubSub,
        submissionId: SubmissionId,
        userId: string,
        file: File,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chunk: any,
        partNumber: number,
        s3MultiPart: PromiseResult<S3.CreateMultipartUploadOutput, AWSError>,
        bytesRead: number,
        type: FileType,
        numAttempts = 0,
    ): Promise<PromiseResult<S3.UploadPartOutput, AWSError>> {
        if (numAttempts >= 3) {
            throw new Error(`Error uploading chunk no: ${partNumber}`);
        }
        if (!s3MultiPart.UploadId) {
            throw new Error('no upload id');
        }
        const partParams = {
            Body: chunk,
            Bucket: s3MultiPart.Bucket || this.bucket,
            Key: s3MultiPart.Key || file.url,
            PartNumber: partNumber,
            UploadId: s3MultiPart.UploadId,
        };

        try {
            const params = await this.s3.uploadPart(partParams).promise();
            return params;
        } catch (e) {
            return await this.handleMultipartChunk(
                pubsub,
                submissionId,
                userId,
                file,
                chunk,
                partNumber,
                s3MultiPart,
                bytesRead,
                type,
                numAttempts + 1,
            );
        }
    }

    async completeMultipartUpload(
        key: string,
        uploadId = '',
        parts: { ETag: string | undefined; PartNumber: number }[],
    ): Promise<PromiseResult<S3.Types.CompleteMultipartUploadOutput, AWSError>> {
        logger.info(`completing multipart for uploadId ${uploadId}`);
        return this.s3
            .completeMultipartUpload({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: parts,
                },
            })
            .promise();
    }

    async deleteManuscript(user: User, fileId: FileId, submissionId: SubmissionId): Promise<boolean> {
        const file = await this.fileRepository.findFileById(fileId);
        if (file === null) {
            logger.info(`deleteManuscript - Unable to find entry with id: ${fileId}`);
            throw new Error(`Unable to find entry with id: ${fileId}`);
        }

        await this.s3
            .deleteObject({
                Bucket: this.bucket,
                Key: this.getFileS3Key(FileType.MANUSCRIPT_SOURCE, submissionId, fileId),
            })
            .promise();
        await this.setStatusToDeleted(user.id, file);
        logger.info(`deleteManuscript - file deleted ${fileId}`);
        return true;
    }

    async deleteSupportingFile(user: User, fileId: FileId, submissionId: SubmissionId): Promise<FileId> {
        const file = await this.fileRepository.findFileById(fileId);
        if (file === null) {
            logger.info(`deleteSupportingFile - Unable to find entry with id: ${fileId}`);
            throw new Error(`Unable to find entry with id: ${fileId}`);
        }

        await this.s3
            .deleteObject({
                Bucket: this.bucket,
                Key: this.getFileS3Key(FileType.SUPPORTING_FILE, submissionId, fileId),
            })
            .promise();
        await this.setStatusToDeleted(user.id, file);
        logger.info(`deleteSupportingFile - file deleted ${fileId}`);
        return fileId;
    }

    async create(
        user: User,
        submissionId: SubmissionId,
        filename: string,
        mimeType: string,
        size: number,
        type: FileType,
    ): Promise<File> {
        if (type === FileType.MANUSCRIPT_SOURCE) {
            const manuscriptFile = await this.findManuscriptFile(submissionId);
            // we have a file so delete it
            if (manuscriptFile !== null) {
                logger.info(`replacing existing manuscriptFile with id: ${manuscriptFile.id}`);
                await this.deleteManuscript(user, manuscriptFile.id, submissionId);
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
        const createdFile = await this.fileRepository.create(file);
        await this.auditFileStatusChange(user.id, file);
        return createdFile;
    }

    private async setStatusToDeleted(userId: string, file: File): Promise<void> {
        file.status = FileStatus.DELETED;
        await this.auditFileStatusChange(userId, file);
    }

    private async setStatusToStored(userId: string, file: File): Promise<void> {
        if (file.status === FileStatus.CREATED) {
            file.status = FileStatus.STORED;
            await this.auditFileStatusChange(userId, file);
        } else {
            throw new Error(`Cannot set file status to STORED: ${file.id}`);
        }
    }

    private async setStatusToCancelled(userId: string, file: File): Promise<void> {
        file.status = FileStatus.CANCELLED;
        await this.auditFileStatusChange(userId, file);
    }

    private async auditFileStatusChange(userId: string, file: File): Promise<boolean> {
        const result = await this.auditService.recordAudit({
            id: AuditId.fromUuid(uuid()),
            userId: UserId.fromUuid(userId),
            action: AuditAction.UPDATED,
            value: file.status,
            objectType: file.type,
            objectId: ObjectId.fromUuid(file.id.toString()),
            created: new Date(),
            updated: new Date(),
        });
        await this.update(file);
        return result;
    }

    async update(file: File): Promise<File> {
        return this.fileRepository.update(file);
    }

    async findManuscriptFile(submissionId: SubmissionId): Promise<File | null> {
        const file = await this.fileRepository.findManuscriptBySubmissionId(submissionId);
        if (!file) {
            logger.info(`cannot find manuscriptFile with submission id: ${submissionId}`);
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

    async handleFileUpload(
        pubsub: PubSub,
        submissionId: SubmissionId,
        userId: string,
        file: File,
        stream: ReadStream,
        type: FileType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<Array<any>> {
        const { url, mimeType } = file;
        const fileUploadManager = await this.s3
            .createMultipartUpload({
                Bucket: this.bucket,
                Key: url,
                ContentType: mimeType,
                ACL: 'private',
            })
            .promise();

        let partNumber = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chunks: Array<any> = [];
        const parts: { ETag: string | undefined; PartNumber: number }[] = [];

        // tracks bytes until 5mb or last chunk, and send up.
        let currentBytes = 0;
        let chunksToSend = [];
        for await (const chunk of stream) {
            const bytesRead = stream.bytesRead;
            currentBytes = currentBytes + chunk.length;
            chunksToSend.push(chunk);
            chunks.push(chunk);
            if (currentBytes >= s3MinChunkSize || bytesRead === file.size) {
                // this will obviously cause some progress update delays as each chunk must be 5MB
                const { ETag } = await this.handleMultipartChunk(
                    pubsub,
                    submissionId,
                    userId,
                    file,
                    Buffer.concat(chunksToSend),
                    partNumber,
                    fileUploadManager,
                    bytesRead,
                    type,
                );
                // reset state tracking.
                chunksToSend = [];
                currentBytes = 0;
                parts.push({ ETag, PartNumber: partNumber });
                partNumber++;
            }
            // this will keep reporting despite AWS' min chunk size 5MB
            await pubsub.publish('UPLOAD_STATUS', {
                fileUploadProgress: {
                    userId,
                    filename: file.filename,
                    fileId: file.id,
                    percentage: Math.floor((bytesRead / file.size) * 100),
                    type,
                    submissionId,
                },
            });
        }

        await this.completeMultipartUpload(file.url, fileUploadManager.UploadId, parts);
        return chunks;
    }

    async uploadManuscript(
        file: File,
        stream: ReadStream,
        userId: string,
        pubsub: PubSub,
        submissionId: SubmissionId,
    ): Promise<Buffer> {
        let buffer: Buffer = new Buffer('');
        try {
            logger.info(`Start uploading the manuscript file with id ${file.id}`);
            const chunks = await this.handleFileUpload(
                pubsub,
                submissionId,
                userId,
                file,
                stream,
                FileType.MANUSCRIPT_SOURCE,
            );
            buffer = Buffer.concat(chunks);
            await this.setStatusToStored(userId, file);
        } catch (e) {
            logger.error(`upload of manuscript file failed with id ${file.id}`, e);
            await this.setStatusToCancelled(userId, file);
        }

        return buffer;
    }

    async uploadSupportingFile(
        file: File,
        stream: ReadStream,
        userId: string,
        pubsub: PubSub,
        submissionId: SubmissionId,
    ): Promise<void> {
        try {
            logger.info(`Start uploading the supporting file with id ${file.id}`);
            await this.handleFileUpload(pubsub, submissionId, userId, file, stream, FileType.SUPPORTING_FILE);
            await this.setStatusToStored(userId, file);
        } catch (e) {
            logger.error(`upload of supporting file has failed with id ${file.id}`, e);
            await this.setStatusToCancelled(userId, file);
            throw e;
        }
    }

    async getFileContent(file: File): Promise<string> {
        const { Body } = await this.s3
            .getObject({
                Bucket: this.bucket,
                Key: file.url,
            })
            .promise();

        return Body as string;
    }

    async deleteFilesForSubmission(user: User, submissionId: SubmissionId): Promise<void> {
        const manuscriptFile = await this.findManuscriptFile(submissionId);
        if (manuscriptFile !== null) {
            await this.deleteManuscript(user, manuscriptFile.id, submissionId);
        }
        const supportingFiles = await this.getSupportingFiles(submissionId);
        await Promise.all(
            supportingFiles.map(supportingFile => this.deleteSupportingFile(user, supportingFile.id, submissionId)),
        );
    }

    private addDownloadLink(file: File): void {
        const downloadLink = this.s3.getSignedUrl('getObject', {
            Bucket: this.bucket,
            Key: file.url,
        });

        file.downloadLink = downloadLink;
    }
}
