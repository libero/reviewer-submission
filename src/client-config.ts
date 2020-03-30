import { readFileSync } from 'fs';

export interface ClientPublicConfig {
    client: {
        majorSubjectAreas: { [key: string]: string };
    };

    fileUpload: {
        maxSizeMB: number;
    };

    newrelic: {
        licenseKey: string;
        applicationId: string;
    };

    googleAnalytics: {
        trackingId: string;
    };

    hotJar: {
        enabled: boolean;
        snippetVersion: number;
    };

    titles: { [key: string]: string };
}

const clientConfigPath = process.env.CLIENT_CONFIG_PATH
    ? process.env.CLIENT_CONFIG_PATH
    : '/etc/reviewer/config.client.json';

const clientConfig: ClientPublicConfig = JSON.parse(readFileSync(clientConfigPath, 'utf8'));

export default clientConfig;
