// REMOVE
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfigService } from './modules/config/config.service';
import { METADATA } from '@nestjs/common/constants';
import { ConfigModule } from './modules/config/config.module';
import { Config } from './modules/config/config.types';
import { Logger } from '@nestjs/common';

if (process.env.NEW_RELIC_NO_CONFIG_FILE) {
    Logger.warn('!!! New Relic has been disabled !!!');
} else {
    require('newrelic');
}

const injectConfigFromFile = (imports): void => {
    const configPath: string = process.env.CONFIG_PATH ? process.env.CONFIG_PATH : '/etc/reviewer/config.json';
    Reflect.defineMetadata('imports', [...imports, ...[ConfigModule.load(configPath)]], AppModule);
};

const injectConfigFromObject = (imports, config: Config): void => {
    Reflect.defineMetadata('imports', [...imports, ...[ConfigModule.load(config)]], AppModule);
};

export const createApp = async (config: null | Config): Promise<NestExpressApplication> => {
    const imports = Reflect.getMetadata(METADATA.IMPORTS, AppModule);
    if (config === null) {
        injectConfigFromFile(imports);
    } else {
        injectConfigFromObject(imports, config);
    }
    return NestFactory.create<NestExpressApplication>(AppModule);
};

export async function bootstrap(config: null | Config): Promise<NestExpressApplication> {
    const app = await createApp(config);
    const configService = app.get(ConfigService);
    // The app is designed to be run in a container so binding it to all NICs
    // should be fine!
    await app.listen(configService.getPort(), '0.0.0.0');
    return app;
}
