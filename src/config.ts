import { readFileSync } from 'fs';
import { Config as KnexConfig } from 'knex';
// TODO: jwt env value
export interface Config {
    port: number;
    knex: KnexConfig;
}

const configPath = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
const thisConfig: Config = JSON.parse(readFileSync(configPath, 'utf8'));

export default thisConfig;
