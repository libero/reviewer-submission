import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Option, Some, None } from 'funfix';
import * as Knex from 'knex';
import { ConfigService } from '../modules/config/config.service';
import { KnexSurveyResponseRepository } from '../repositories/survey-response';
import { SurveyResponseController } from 'src/controllers/survey-response.controller';
import { SurveyAnswer } from 'src/entities/survey-answer';
import { SurveyResponse } from 'src/entities/survey-response';
import { SurveyId } from '../types/survey';
import { SubmissionId } from '../types/submission';
// REMOVE - MAYBE? PROBABLY!
@Injectable()
export class SurveyService implements OnModuleDestroy {
    controller: Option<SurveyResponseController> = None;
    surveyResponseRepository: KnexSurveyResponseRepository;

    constructor(config: ConfigService) {
        this.surveyResponseRepository = new KnexSurveyResponseRepository(
            Knex(config.getSurveyResponseRepositoryConnection()),
        );

        this.controller = Some(new SurveyResponseController(this.surveyResponseRepository));
    }

    onModuleDestroy(): void {
        this.controller.get().close();
        this.controller = None;
    }

    // again, do we use SurveyAnswer or an interface?
    submitResponse(surveyId: SurveyId, submissionId: SubmissionId, answers: SurveyAnswer[]): Promise<SurveyResponse> {
        return this.controller.map(controller => controller.submitResponse(surveyId, submissionId, answers)).get();
    }
}
