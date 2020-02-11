import { readFileSync } from 'fs';
import { Config as KnexConfig } from 'knex';

export interface Config {
    port: number;
    knex: KnexConfig;
    user_adapter_url: string;
    authentication_jwt_secret: string;
    max_ql_complexity: number;
    max_ql_depth: number;
}

const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
const thisConfig: Config = JSON.parse(readFileSync(configPath, 'utf8'));

export default thisConfig;
