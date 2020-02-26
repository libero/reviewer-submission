import * as Knex from 'knex';
import uuid = require('uuid');
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubFileRepository from '../repositories/xpub-file';

export class FileService {
    submissionRepository: XpubFileRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.submissionRepository = new XpubFileRepository(adapter);
    }

    async create() {}
}
