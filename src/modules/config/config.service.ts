
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export interface SubmissionRepositoryConnection {
  dialect: string;
  connection: {
    filename?: string;
  };
}

export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor(filePath: string) {
    // if a .env file is present, store it, otherwise ignore
    if (fs.existsSync(filePath)) {
      const { parsed } = dotenv.config({ path: filePath });
      this.envConfig = parsed || {};
    } else {
      this.envConfig = {};
    }
  }

  get(key: string): string {
    // fallback to process environment config if not found and then fall back to empty string
    return this.envConfig[key] || process.env[key] || '';
  }

  getSubmissionRepositoryConnection(): SubmissionRepositoryConnection {
    return {
      dialect: 'sqlite3',
      connection: {
        filename: './data.db',
      },
    };
  }
}
