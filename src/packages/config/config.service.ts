
import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor(filePath: string) {
    // if a .env file is present, store it, otherwise ignore
    if (fs.existsSync(filePath)) {
      const { parsed } = dotenv.config({ path: filePath })
      this.envConfig = parsed
    } else {
      this.envConfig = {}
    }
  }

  get(key: string): string {
    // fallback to process environment config if not found
    return this.envConfig[key] || process.env[key]
  }
}
