import { readFileSync } from 'fs';
import { Config as KnexConfig } from 'knex';

export interface S3Config {
    accessKeyId: string;
    secretAccessKey: string;
    s3ForcePathStyle: boolean;
    fileBucket: string;
    awsEndPoint: string;
}

export interface ScienceBeamConfig {
    api_url: string;
    timeout: string;
}

export interface Config {
    port: number;
    knex: KnexConfig;
    user_adapter_url: string;
    authentication_jwt_secret: string;
    max_ql_complexity: number;
    max_ql_depth: number;
    s3: S3Config;
    science_beam: ScienceBeamConfig;
}

const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
const thisConfig: Config = JSON.parse(readFileSync(configPath, 'utf8'));

export default thisConfig;
