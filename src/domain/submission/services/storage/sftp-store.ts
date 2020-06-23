import * as SftpClient from 'ssh2-sftp-client';
import { SubmissionId } from '../../types';
import { PackageLocation, SubmissionWriter, PackageLocationType } from './types';
import { MecaConfig } from 'src/config';

export class SftpStore implements SubmissionWriter {
    private mecaPostfix = '-meca.zip';
    private sftpClient: SftpClient;

    constructor(private readonly mecaConfig: MecaConfig) {
        this.sftpClient = new SftpClient();
    }

    async write(submissionId: SubmissionId, buffer: Buffer): Promise<PackageLocation> {
        const remotePath = this.mecaConfig.sftp.path;
        await this.sftpClient.connect({
            host: this.mecaConfig.sftp.host,
            port: this.mecaConfig.sftp.port,
            username: this.mecaConfig.sftp.username,
            password: this.mecaConfig.sftp.password,
        });
        await this.sftpClient.mkdir(remotePath, true);
        const transferName = `${remotePath}/${submissionId}.transfer`;
        const finalName = `${remotePath}/${submissionId}${this.mecaPostfix}`;
        await this.sftpClient.put(buffer, transferName);
        await this.sftpClient.rename(transferName, finalName);
        await this.sftpClient.end();

        return Promise.resolve({
            location: `${remotePath}/${submissionId}${this.mecaPostfix}`,
            type: PackageLocationType.SFTP,
            submissionId,
        });
    }
}
