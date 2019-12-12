import * as fs from 'fs';
import { Config as KnexConfig } from 'knex';
import { get } from 'lodash';
import { Config, DatabaseConnectionConfig } from './config.types';

export class ConfigService {
    private static supportedClients: string[] = ['pg', 'sqlite3'];
    private readonly config: Config;

    constructor(initializer: string | Config) {
        if (typeof initializer == 'string') {
            this.config = this.load(initializer);
        } else {
            this.config = initializer;
        }
    }

    private load(filePath: string): Config {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            throw new Error(`Config file not found at ${filePath}`);
        }
    }

    getPort(): number {
        return this.config.port;
    }

    getSubmissionRepositoryConnection(): KnexConfig {
        const config: DatabaseConnectionConfig = get(this.config, 'databases.submission');

        return this.getKnexDatabaseConfig(config);
    }

    getSurveyResponseRepositoryConnection(): KnexConfig {
        const config: DatabaseConnectionConfig = get(this.config, 'databases.survey');

        return this.getKnexDatabaseConfig(config);
    }

    private getKnexDatabaseConfig(config: DatabaseConnectionConfig): KnexConfig {
        let result: KnexConfig;
        if (config.type === 'sqlite3') {
            result = {
                client: 'sqlite3',
                connection: {
                    filename: config.database,
                },
                useNullAsDefault: true,
            };
        } else if (ConfigService.supportedClients.includes(config.type)) {
            result = {
                client: config.type,
                connection: {
                    host: config.host,
                    database: config.database,
                    user: config.username,
                    password: config.password,
                    port: config.port,
                },
            };
        } else {
            throw new Error(`Configuration contains unsupported database client: ${config.type}`);
        }
        return result;
    }
}
