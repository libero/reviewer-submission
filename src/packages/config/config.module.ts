
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

const envFilename = '.env' + (process.env.NODE_ENV ? '.' + process.env.NODE_ENV : '')

@Module({
  providers: [
    {
      provide: ConfigService,
      useValue: new ConfigService(envFilename),
    },
  ],
  exports: [ConfigService],
})

export class ConfigModule {}
