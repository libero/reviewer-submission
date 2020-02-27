import * as Knex from 'knex';
import uuid = require('uuid');
import axios from 'axios';
import xml2js from 'xml2js';
import { promisify } from 'util';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubSemanticExtractionRepository from '../repositories/xpub-semantic-extraction';

export class SemanticExtractionService {
    semanticExtraction: XpubSemanticExtractionRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.semanticExtraction = new XpubSemanticExtractionRepository(adapter);
    }

    async extractTitle(fileContents: Buffer, mimeType: string, filename: string): Promise<string> {
        const include = 'title';
        const scienceBeamApiUrl = 'https://sciencebeam-texture.elifesciences.org/api/convert';
        const scienceBeamTimeout = 20000;
        let title = '';
        let titleArray = 'timed-out';
        const xmlBuffer = await axios.post(scienceBeamApiUrl, {
            body: fileContents,
            qs: {
                filename,
                include,
            },
            headers: { 'content-type': mimeType },
            timeout: scienceBeamTimeout,
        });

        const parseString = promisify(xml2js.parseString);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xmlData: any = await parseString(xmlBuffer.toString());

        if (xmlData.article) {
            const firstArticle = xmlData.article.front[0];
            const articleMeta = firstArticle['article-meta'];
            const firstMeta = articleMeta[0];
            const titleGroup = firstMeta['title-group'];
            const firstTitleGroup = titleGroup[0];
            titleArray = firstTitleGroup['article-title'];
            title = titleArray[0];
        }
        await this.submissionRepository(title, subms);
        return title;
    }
}
