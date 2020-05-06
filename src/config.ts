/* eslint-disable @typescript-eslint/camelcase */
import { Config as KnexConfig } from 'knex';

export interface S3Config {
    accessKeyId: string;
    secretAccessKey: string;
    s3ForcePathStyle: boolean;
    fileBucket: string;
    awsEndPoint?: string;
}

export interface ScienceBeamConfig {
    api_url: string;
    timeout: number;
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
    max_file_size_in_bytes: number;
}

export interface ClientPublicConfig {
    majorSubjectAreas: { [key: string]: string };
    fileUpload: {
        maxSizeMB: number;
    };
}

const appConfig: Config = {
    port: 3000,
    knex: {
        client: 'pg',
        connection: {
            host: process.env.DATABASE_HOST,
            database: process.env.DATABASE_NAME,
            password: process.env.DATABASE_PASSWORD,
            user: process.env.DATABASE_USER,
            port: Number(process.env.DATABASE_PORT),
        },
    },
    s3: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        s3ForcePathStyle: Boolean(process.env.S3_FORCE_PATH_STYLE) || true,
        fileBucket: process.env.S3_FILE_BUCKET || '',
        awsEndPoint: process.env.S3_AWS_ENDPOINT,
    },
    max_ql_depth: Number(process.env.MAX_QL_DEPTH),
    max_ql_complexity: Number(process.env.MAX_QL_COMPLEXITY),
    max_file_size_in_bytes: Number(process.env.MAX_FILE_SIZE_IN_BYTES),
    authentication_jwt_secret: process.env.AUTHENTICATION_JWT_SECRET || '',
    user_adapter_url: process.env.USER_ADAPTER_URL || '',
    science_beam: {
        api_url: process.env.SCIENCE_BEAM_URL || '',
        timeout: Number(process.env.SCIENCE_BEAM_TIMEOUT),
    },
};

export default appConfig;
