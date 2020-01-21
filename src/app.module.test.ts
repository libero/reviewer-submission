import { METADATA } from '@nestjs/common/constants';
import { AppModule } from './app.module';
import { ConfigModule } from './modules/config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// These tests could be construed as testing nest.js - however because we change
// the behviour at runtime it's worth checking the module is constructed in this
// state.

describe('AppModule - construction', () => {
    it('does not contain ConfigModule (this gets injected in)', () => {
        const imports = Reflect.getMetadata(METADATA.IMPORTS, AppModule);
        expect(imports).not.toContain(ConfigModule);
    });

    it('all imports are as expected', () => {
        const imports = Reflect.getMetadata(METADATA.IMPORTS, AppModule);
        expect(imports).toHaveLength(5);
    });

    it('all controllers are as expected', () => {
        const controllers = Reflect.getMetadata(METADATA.CONTROLLERS, AppModule);
        expect(controllers).toHaveLength(1);
        expect(controllers).toContain(AppController);
    });

    it('all imports are as expected', () => {
        const providers = Reflect.getMetadata(METADATA.PROVIDERS, AppModule);
        expect(providers).toHaveLength(1);
        expect(providers).toContain(AppService);
    });
});
