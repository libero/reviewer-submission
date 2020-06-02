/* eslint-disable @typescript-eslint/camelcase */
import { S3Store } from './s3-store';
import { SubmissionId } from '../../types';
import { PackageLocationType } from './types';
import * as S3 from 'aws-sdk/clients/s3';
import { MecaConfig } from 'src/config';

jest.mock('aws-sdk/clients/s3');

describe('S3Store', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('writes to s3 bucket', async () => {
        const s3Config = {
            accessKeyId: 'access_key_id',
            secretAccessKey: 'secret_access_key',
            s3ForcePathStyle: true,
            fileBucket: 'bucket',
            awsEndPoint: 'http://s3',
        };
        const mecaConfig = {
            s3_path: '/meca',
        } as MecaConfig;
        const putObjectMock = jest.fn();
        const promiseMock = jest.fn();

        S3.prototype.putObject = putObjectMock.mockImplementation(() => ({
            promise: promiseMock,
        }));

        const s3Store = new S3Store(s3Config, mecaConfig);
        const buffer = Buffer.from('archive');
        const submissionId = SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a');
        const location = await s3Store.write(submissionId, buffer);
        const expectedKey = `/meca/89e0aec8-b9fc-4413-8a37-5cc775edbe3a-meca.zip`;

        expect(putObjectMock).toHaveBeenCalledTimes(1);
        expect(putObjectMock).toHaveBeenCalledWith({
            Body: buffer,
            Bucket: 'bucket',
            ACL: 'private',
            ContentType: 'application/zip',
            Key: expectedKey,
        });

        expect(location).toEqual({
            location: expectedKey,
            type: PackageLocationType.S3,
            submissionId: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
        });
    });
});
