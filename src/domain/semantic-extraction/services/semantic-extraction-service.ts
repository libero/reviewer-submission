import * as Knex from 'knex';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import xml2js from 'xml2js';
import { promisify } from 'util';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubSemanticExtractionRepository from '../repositories/xpub-semantic-extraction';
import { SemanticExtractionId } from '../types';
import { InfraLogger as logger } from '../../../logger';
import { SubmissionId } from '../../submission/types';
import { ScienceBeamConfig } from '../../../config';

export class SemanticExtractionService {
    semanticExtractionRepository: XpubSemanticExtractionRepository;
    scienceBeamConfig: ScienceBeamConfig;

    constructor(knex: Knex<{}, unknown[]>, scienceBeamConfig: ScienceBeamConfig) {
        const adapter = createKnexAdapter(knex, 'public');
        this.semanticExtractionRepository = new XpubSemanticExtractionRepository(adapter);
        this.scienceBeamConfig = scienceBeamConfig;
    }

    async extractTitle(
        fileContents: Buffer,
        mimeType: string,
        filename: string,
        submissionId: SubmissionId,
    ): Promise<string> {
        const include = 'title';
        let title = '';
        let titleArray;

        try {
            const xmlBuffer = await axios.post(this.scienceBeamConfig.api_url, {
                body: fileContents,
                qs: {
                    filename,
                    include,
                },
                headers: { 'content-type': mimeType },
                timeout: this.scienceBeamConfig.timeout,
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

            await this.semanticExtractionRepository.create({
                id: SemanticExtractionId.fromUuid(uuid()),
                submissionId,
                fieldName: 'title',
                value: title,
            });
        } catch (e) {
            logger.error('issue with semantic extraction');
        }

        return title;
    }
}
