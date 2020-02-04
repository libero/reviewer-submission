import { Module } from '@nestjs/common';
import { SubmissionResolver } from './submission.resolver';
import { SubmissionService } from '../../services/submission';
import { ConfigModule } from '../config/config.module';
// REMOVE
@Module({
    imports: [ConfigModule],
    providers: [SubmissionService, SubmissionResolver],
})
export class SubmissionModule {}
