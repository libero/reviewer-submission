import * as Knex from 'knex';
import uuid from 'uuid';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubFileRepository from '../repositories/xpub-file';
import { FileId, FileType, FileStatus } from '../types';
import File from './models/file';
import { SubmissionId } from 'src/domain/submission/types';

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

    async upload() {}
}
