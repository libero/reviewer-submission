/* eslint-disable @typescript-eslint/camelcase */
import { PgConnectionConfig as KnexConfig } from 'knex';

export interface S3Config {
    accessKeyId: string;
    secretAccessKey: string;
    s3ForcePathStyle: boolean;
    fileBucket: string;
    awsEndPoint?: string;
}

export interface SESConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

export interface ScienceBeamConfig {
    api_url: string;
    timeout: number;
}

export interface MecaConfig {
    s3_path: string;
    sftp: {
        host: string;
        port: number;
        username: string;
        password: string;
        path: string;
    };
    api_key: string;
    email: {
        subject_prefix: string;
        recipient: string;
    };
}

export interface Config {
    port: number;
    db_connection: KnexConfig;
    user_api_url: string;
    authentication_jwt_secret: string;
    max_ql_complexity: number;
    max_ql_depth: number;
    s3: S3Config;
    ses: SESConfig;
    mail: {
        sender: string;
        sendmail: boolean;
    };
    science_beam: ScienceBeamConfig;
    max_file_size_in_bytes: number;
    meca_config: MecaConfig;
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
        s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE && process.env.S3_FORCE_PATH_STYLE === 'true' ? true : false,
        fileBucket: envOrEmpty('S3_FILE_BUCKET'),
        awsEndPoint: envOrEmpty('S3_AWS_ENDPOINT'),
    },
    ses: {
        accessKeyId: envOrEmpty('SES_ACCESS_KEY_ID'),
        secretAccessKey: envOrEmpty('SES_SECRET_ACCESS_KEY'),
        region: envOrEmpty('SES_REGION'),
    },
    mail: {
        sendmail: process.env.SEND_MAIL && process.env.SEND_MAIL === 'true' ? true : false,
        sender: envOrEmpty('MAIL_SENDER'),
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
    meca_config: {
        s3_path: envOrEmpty('MECA_S3_PATH'),
        sftp: {
            host: envOrEmpty('MECA_SFTP_HOST'),
            port: Number(envOrEmpty('MECA_SFTP_PORT')) || 22,
            username: envOrEmpty('MECA_SFTP_USERNAME'),
            password: envOrEmpty('MECA_SFTP_PASSWORD'),
            path: envOrEmpty('MECA_SFTP_PATH'),
        },
        api_key: envOrEmpty('MECA_API_KEY'),
        email: {
            subject_prefix: envOrEmpty('MECA_EMAIL_PREFIX'),
            recipient: envOrEmpty('MECA_EMAIL_RECIPIENT'),
        },
    },
};

export default appConfig;
