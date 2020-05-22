/* eslint-disable @typescript-eslint/camelcase */
import { PgConnectionConfig as KnexConfig } from 'knex';

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
    db_connection: KnexConfig;
    user_api_url: string;
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

const envOrEmpty = (name: string): string => {
    return process.env[name] ? (process.env[name] as string) : '';
};

const appConfig: Config = {
    port: 3000,
    db_connection: {
        host: envOrEmpty('DATABASE_HOST'),
        database: envOrEmpty('DATABASE_NAME'),
        password: envOrEmpty('DATABASE_PASSWORD'),
        user: envOrEmpty('DATABASE_USER'),
        port: Number(envOrEmpty('DATABASE_PORT')),
    },
    s3: {
        accessKeyId: envOrEmpty('S3_ACCESS_KEY_ID'),
        secretAccessKey: envOrEmpty('S3_SECRET_ACCESS_KEY'),
        s3ForcePathStyle: Boolean(process.env.S3_FORCE_PATH_STYLE) || true,
        fileBucket: envOrEmpty('S3_FILE_BUCKET'),
        awsEndPoint: envOrEmpty('S3_AWS_ENDPOINT'),
    },
    max_ql_depth: Number(envOrEmpty('MAX_QL_DEPTH')),
    max_ql_complexity: Number(envOrEmpty('MAX_QL_COMPLEXITY')),
    max_file_size_in_bytes: Number(envOrEmpty('MAX_FILE_SIZE_IN_BYTES')),
    authentication_jwt_secret: envOrEmpty('AUTHENTICATION_JWT_SECRET'),
    user_api_url: envOrEmpty('USER_API_URL'),
    science_beam: {
        api_url: envOrEmpty('SCIENCE_BEAM_URL'),
        timeout: Number(envOrEmpty('SCIENCE_BEAM_TIMEOUT')),
    },
};

export default appConfig;
