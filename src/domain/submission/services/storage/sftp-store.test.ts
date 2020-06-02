/* eslint-disable @typescript-eslint/camelcase */
import * as SftpClient from 'ssh2-sftp-client';
import { SftpStore } from './sftp-store';
import { SubmissionId } from '../../types';
import { PackageLocationType } from './types';
import { MecaConfig } from 'src/config';

jest.mock('ssh2-sftp-client');

describe('SftpStore', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('writes to sftp', async () => {
        const mecaConfig = {
            sftp: {
                host: 'sftp://host',
                username: 'username',
                password: 'password',
                port: 22,
                path: '/meca',
            },
        } as MecaConfig;

        const mockMkdir = jest.fn();
        const mockPut = jest.fn();
        const mockEnd = jest.fn();

        SftpClient.prototype.mkdir = mockMkdir;
        SftpClient.prototype.put = mockPut;
        SftpClient.prototype.rename = jest.fn();
        SftpClient.prototype.end = mockEnd;

        const sftpStore = new SftpStore(mecaConfig);
        const buffer = Buffer.from('archive');
        const submissionId = SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a');
        const location = await sftpStore.write(submissionId, buffer);
        const expectedKey = `/meca/89e0aec8-b9fc-4413-8a37-5cc775edbe3a-meca.zip`;

        expect(mockMkdir).toHaveBeenCalledTimes(1);
        expect(mockMkdir).toHaveBeenCalledWith('/meca', true);
        expect(mockPut).toHaveBeenCalledTimes(1);
        expect(mockPut.mock.calls[0][0]).toEqual(buffer);
        expect(mockEnd).toHaveBeenCalledTimes(1);

        expect(location).toEqual({
            location: expectedKey,
            type: PackageLocationType.SFTP,
            submissionId: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
        });
    });
});
