import * as Knex from 'knex';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import * as xml2js from 'xml2js';
import { createKnexAdapter } from '../../knex-table-adapter';
import XpubSemanticExtractionRepository from '../repositories/xpub-semantic-extraction';
import { SemanticExtractionId, Suggestion } from '../types';
import { InfraLogger as logger } from '../../../logger';
import { SubmissionId } from '../../submission/types';
import { ScienceBeamConfig } from '../../../config';
import SemanticExtraction from './models/semantic-extraction';

export class SemanticExtractionService {
    semanticExtractionRepository: XpubSemanticExtractionRepository;
    scienceBeamConfig: ScienceBeamConfig;

    constructor(knex: Knex<{}, unknown[]>, scienceBeamConfig: ScienceBeamConfig) {
        const adapter = createKnexAdapter(knex, 'public');
        this.semanticExtractionRepository = new XpubSemanticExtractionRepository(adapter);
        this.scienceBeamConfig = scienceBeamConfig;
    }

    async getSuggestion(submissionId: SubmissionId): Promise<Suggestion | null> {
        return await this.semanticExtractionRepository.getSuggestionBySubmissionId(submissionId);
    }

    async getSuggestionsFromData(submissionId: SubmissionId, response: Buffer): Promise<boolean> {
        let success = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const xmlData: any = await xml2js.parseStringPromise(response.toString());
        if (xmlData && xmlData.article) {
            const firstArticle = xmlData.article.front[0];
            const articleMeta = firstArticle['article-meta'];
            const firstMeta = articleMeta[0];
            const titleGroup = firstMeta['title-group'];
            const firstTitleGroup = titleGroup[0];
            const titleArray = firstTitleGroup['article-title'];
            const title = titleArray[0];

            try {
                const seObject = new SemanticExtraction(
                    SemanticExtractionId.fromUuid(uuid()),
                    submissionId,
                    new Date(),
                    'title',
                    title,
                );
                await this.semanticExtractionRepository.create(seObject);
                success = true;
            } catch (error) {
                logger.error(`Could not write the suggestions. Failed with ${error}`);
            }
        } else {
            logger.error('Unexpected return value from Sciencebeam');
        }
        return success;
    }

    async extractSuggestions(
        fileContents: Buffer,
        mimeType: string,
        filename: string,
        submissionId: SubmissionId,
    ): Promise<boolean> {
        logger.info(`Sciencebeam extracting ${this.scienceBeamConfig.api_url}`);
        const include = 'title';
        const timeout = this.scienceBeamConfig.timeout;
        let success = false;
        try {
            const response = await axios.post(this.scienceBeamConfig.api_url, fileContents, {
                headers: { 'Content-Type': mimeType },
                params: { filename, include },
                timeout,
            });
            if (response.status == 200) {
                logger.info(`Sciencebeam extracting complete for submission id ${submissionId}`);
                success = await this.getSuggestionsFromData(submissionId, response.data);
            } else {
                logger.error(`Sciencebeam responded with: ${response.status} and returned ${response.data}`);
            }
        } catch (error) {
            if (error.response) {
                logger.error(
                    `Sciencebeam Error: ${error.response.status} returned:${JSON.stringify(error.response.data)}`,
                );
                logger.error(
                    `Issue with semantic extraction: MimeType: ${mimeType}, filename: ${filename} | submission id: ${submissionId}`,
                );
            } else if (error.request) {
                logger.error('No response response received for request');
            } else {
                logger.error(`Error ${error.message}`);
            }
        }

        return success;
    }
}
