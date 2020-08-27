import { readFileSync } from 'fs';
import axios from 'axios';
import { SemanticExtractionService } from './semantic-extraction-service';
import Knex from 'knex';
import XpubSemanticExtractionRepository from '../repositories/xpub-semantic-extraction';
import { SubmissionId } from '../../submission/types';
import { mocked } from 'ts-jest/utils';
import { InfraLogger as logger } from '../../../logger';

jest.mock('axios');
jest.mock('../../../logger');

describe('scienceBeamApi', () => {
    const mockCreate = jest.fn();
    const mockContents = readFileSync(`${__dirname}/article.test.data.xml`);
    const emptyBuffer = Buffer.alloc(0, '');
    let returnedStatus = 500;
    let returnedContents = emptyBuffer;
    let service: SemanticExtractionService;

    beforeAll(() => {
        XpubSemanticExtractionRepository.prototype.create = mockCreate;
    });

    beforeEach(() => {
        jest.resetAllMocks();

        service = new SemanticExtractionService((null as unknown) as Knex, {
            // eslint-disable-next-line @typescript-eslint/camelcase
            api_url: 'string',
            timeout: 100,
        });
        const mockedPost = mocked(axios.post, true);

        mockedPost.mockImplementationOnce(() => {
            if (returnedStatus == 200) {
                return Promise.resolve({
                    data: returnedContents,
                    status: returnedStatus,
                });
            } else {
                return Promise.reject({
                    response: {
                        data: returnedContents,
                        status: returnedStatus,
                    },
                });
            }
        });
    });

    it('extracts correct data', async () => {
        returnedStatus = 200;
        returnedContents = mockContents;
        const id = SubmissionId.fromUuid('2c2d1f54-a2cb-4f0d-95c0-27d3aa444f4e');

        const result = await service.extractSuggestions(emptyBuffer, 'application/pdf', 'test.pdf', id);

        expect(mockCreate).toBeCalledTimes(1);
        expect(logger.info).toBeCalledTimes(2);
        expect(logger.info).toBeCalledWith('Sciencebeam extracting string');
        expect(result).toBe(true);
    });

    it('silently fails if no response and request object', async () => {
        const id = SubmissionId.fromUuid('2c2d1f54-a2cb-4f0d-95c0-27d3aa444f4e');
        jest.resetAllMocks();
        const mockedPost = mocked(axios.post, true);

        mockedPost.mockImplementationOnce(() => {
            return Promise.reject(Error('error'));
        });
        const result = await service.extractSuggestions(emptyBuffer, 'application/pdf', 'test.pdf', id);

        expect(mockCreate).toBeCalledTimes(0);
        expect(logger.error).toBeCalledTimes(1);
        expect(logger.error).toHaveBeenNthCalledWith(1, 'Error error');

        expect(result).toBe(false);
    });

    it('silently fails if no response object but has request', async () => {
        const id = SubmissionId.fromUuid('2c2d1f54-a2cb-4f0d-95c0-27d3aa444f4e');
        jest.resetAllMocks();
        const mockedPost = mocked(axios.post, true);

        mockedPost.mockImplementationOnce(() => {
            return Promise.reject({
                request: {},
            });
        });
        const result = await service.extractSuggestions(emptyBuffer, 'application/pdf', 'test.pdf', id);

        expect(mockCreate).toBeCalledTimes(0);
        expect(logger.error).toBeCalledTimes(1);
        expect(logger.error).toHaveBeenNthCalledWith(1, 'No response response received for request');
        expect(result).toBe(false);
    });

    it('silently fails if status code not 200', async () => {
        returnedStatus = 400;
        returnedContents = emptyBuffer;
        const id = SubmissionId.fromUuid('2c2d1f54-a2cb-4f0d-95c0-27d3aa444f4e');

        const result = await service.extractSuggestions(emptyBuffer, 'application/pdf', 'test.pdf', id);

        expect(mockCreate).toBeCalledTimes(0);
        expect(logger.error).toBeCalledTimes(2);
        expect(logger.error).toHaveBeenNthCalledWith(1, 'Sciencebeam Error: 400 returned:{"type":"Buffer","data":[]}');
        expect(logger.error).toHaveBeenNthCalledWith(
            2,
            'Issue with semantic extraction: MimeType: application/pdf, filename: test.pdf | submission id: 2c2d1f54-a2cb-4f0d-95c0-27d3aa444f4e',
        );
        expect(result).toBe(false);
    });

    it('silently fails if cannot get title from successful extraction', async () => {
        returnedStatus = 200;
        returnedContents = emptyBuffer;
        const id = SubmissionId.fromUuid('2c2d1f54-a2cb-4f0d-95c0-27d3aa444f4e');

        const result = await service.extractSuggestions(emptyBuffer, 'application/pdf', 'test.pdf', id);

        expect(mockCreate).toBeCalledTimes(0);
        expect(logger.error).toBeCalledTimes(1);
        expect(logger.error).toBeCalledWith('Unexpected return value from Sciencebeam');
        expect(result).toBe(false);
    });

    it('silently fails if database on failure', async () => {
        returnedStatus = 200;
        returnedContents = mockContents;
        mockCreate.mockRejectedValue('database on fire');
        const id = SubmissionId.fromUuid('2c2d1f54-a2cb-4f0d-95c0-27d3aa444f4e');

        const result = await service.extractSuggestions(emptyBuffer, 'application/pdf', 'test.pdf', id);

        expect(mockCreate).toBeCalledTimes(1);
        expect(logger.error).toBeCalledTimes(1);
        expect(logger.error).toBeCalledWith('Could not write the suggestions. Failed with database on fire');
        expect(result).toBe(false);
    });
});
