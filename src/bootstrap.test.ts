import { bootstrap } from './bootstrap';
import { NestApplication } from '@nestjs/core';

process.env.CONFIG_PATH = 'config/config.example.json';

describe('bootstrap', () => {
    it('can bootstrap, and close gracefully', async () => {
        const app = ((await bootstrap(null)) as unknown) as NestApplication;
        // this will throw if its not ready to receive requests
        // https://github.com/nestjs/nest/blob/077bf15efb7efa606524ffc0bfcf57fcdd532905/packages/core/nest-application.ts#L243
        await expect(app.getUrl()).resolves.toEqual('http://127.0.0.1:3000');
        await app.close();
    });
});
