
export interface DatabaseConnectionConfig {
    type: string;
    host: string;
    port: number;
    database: string;
    username?: string;
    password?: string;
}

export interface Config {
    port: number;
    databases: {
        survey: DatabaseConnectionConfig,
        submission: DatabaseConnectionConfig
    };
}
