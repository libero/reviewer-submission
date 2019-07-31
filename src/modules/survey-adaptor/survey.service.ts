import { Injectable } from '@nestjs/common';
import { Option, Some, None } from 'funfix';
import * as Knex from 'knex';
import { ConfigService } from '../config/config.service';
import { KnexSurveyResponseRepository } from './survey-response.repository';
import { SurveyResponseController } from 'src/packages/survey/survey-response.controller';
import { SurveyAnswer } from 'src/packages/survey/survey-answer';
import { SurveyResponse } from 'src/packages/survey/survey-response.entity';

@Injectable()
export class SurveyService {
  controller: Option<SurveyResponseController> = None;

  constructor(config: ConfigService) {
    const surveyResponseRepository = new KnexSurveyResponseRepository(Knex(config.getSurveyResponseRepositoryConnection()));

    this.controller = Some(new SurveyResponseController(surveyResponseRepository));
  }

  // again, do we use SurveyAnswer or an interface?
  submitResponse(surveyId: string, submissionId: string, answers: Array<SurveyAnswer>): Promise<SurveyResponse> {
    return this.controller.map(controller => controller.submitResponse(surveyId, submissionId, answers)).get();
  }
}

