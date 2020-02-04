import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { SurveyService } from '../../services/survey.service';
import { SurveyResolver } from './survey.resolver';
// REMOVE
@Module({
    imports: [ConfigModule],
    providers: [SurveyService, SurveyResolver],
})
export class SurveyModule {}
