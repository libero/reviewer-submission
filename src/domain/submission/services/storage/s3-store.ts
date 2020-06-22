import { SubmissionId } from '../../types';
import { PackageLocation, SubmissionWriter, PackageLocationType } from './types';
import { S3Config, MecaConfig } from 'src/config';
import * as S3 from 'aws-sdk/clients/s3';

export class S3Store implements SubmissionWriter {
    private mecaPostfix = '-meca.zip';
    private s3: S3;
    private bucket: string;

    constructor(s3config: S3Config, private readonly mecaConfig: MecaConfig) {
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

    async write(submissionId: SubmissionId, buffer: Buffer): Promise<PackageLocation> {
        const key = `${this.mecaConfig.s3_path}/${submissionId}${this.mecaPostfix}`;
        const params = {
            Body: buffer,
            Bucket: this.bucket,
            Key: key,
            ACL: 'private',
            ContentType: 'application/zip',
        };

        await this.s3.putObject(params).promise();

        return {
            location: key,
            type: PackageLocationType.S3,
            submissionId,
        };
    }
}
