import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { SurveyService } from './survey.service';
import { SurveyResolver } from './survey.resolver';

@Module({
  imports: [ConfigModule],
  providers: [SurveyService, SurveyResolver],
})

export class SurveyModule {}
