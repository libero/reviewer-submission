
import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

// @Module({
//   providers: [
//     {
//       provide: ConfigService,
//       useValue: new ConfigService(envFilename),
//     },
//   ],
//   exports: [ConfigService],
// })

@Global()
@Module({})
export class ConfigModule {
  static load(configPath: string): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: ConfigService, useValue: new ConfigService(configPath)}],
      exports: [ConfigService],
    };
  }
}
