import { ConfigService } from './config.service';
import { Config } from './config.types';

const config: Config = {
    port: 12345,
    databases: {
        survey: { type: 'sqlite3', host: 'Terry Wogan', port: 123, database: 'survey' },
        submission: { type: 'pg', host: 'Clive James', port: 456, database: 'submission' },
    },
};

const badConfig: Config = {
    port: 12345,
    databases: {
        survey: { type: 'blue', host: 'Terry Wogan', port: 123, database: 'survey' },
        submission: { type: 'yellow', host: 'Clive James', port: 456, database: 'submission' },
    },
};

describe('ConfigService', () => {
    it('can be initialised with a file', () => {
        const cs = new ConfigService('src/modules/config/test-config.json');
        expect(cs.getPort()).toEqual(33333);
        expect(cs.getSurveyResponseRepositoryConnection()).toEqual({
            client: 'sqlite3',
            connection: {
                filename: 'data2.db',
            },
            useNullAsDefault: true,
        });
        expect(cs.getSubmissionRepositoryConnection()).toEqual({
            client: 'sqlite3',
            connection: {
                filename: 'data1.db',
            },
            useNullAsDefault: true,
        });
    });

    it('can be initialized with an object', () => {
        const cs = new ConfigService(config);

        expect(cs.getPort()).toBe(12345);
        expect(cs.getSurveyResponseRepositoryConnection()).toEqual({
            client: 'sqlite3',
            connection: {
                filename: 'survey',
            },
            useNullAsDefault: true,
        });
        expect(cs.getSubmissionRepositoryConnection()).toEqual({
            client: 'pg',
            connection: {
                host: 'Clive James',
                port: 456,
                database: 'submission',
                password: undefined,
                user: undefined,
            },
        });
    });

    it('database types - bad ones throw an error', () => {
        const cs = new ConfigService(badConfig);
        expect(cs.getPort()).toBe(12345);
        expect(() => {
            cs.getSurveyResponseRepositoryConnection();
        }).toThrow('Configuration contains unsupported database client');
    });
});
