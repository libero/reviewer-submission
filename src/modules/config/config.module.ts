import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from './config.service';
import { Config } from './config.types';

@Global()
@Module({})
export class ConfigModule {

    static load(initializer: string | Config): DynamicModule {
        return {
            module: ConfigModule,
            providers: [{
                provide: ConfigService,
                useValue: new ConfigService(initializer)
            }],
            exports: [ConfigService],
        };
    }
}
