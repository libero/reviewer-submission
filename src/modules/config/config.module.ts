import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

@Global()
@Module({})
export class ConfigModule {
    static load(configPath: string): DynamicModule {
        return {
            module: ConfigModule,
            providers: [{ provide: ConfigService, useValue: new ConfigService(configPath) }],
            exports: [ConfigService],
        };
    }
}
