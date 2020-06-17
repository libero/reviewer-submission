import { uuidType } from 'typesafe-uuid';
import { SurveyResponse } from './services/models/survey-response';

export class SurveyId extends uuidType<'SurveyId'>() {}
export class SurveyResponseId extends uuidType<'SurveyResponseId'>() {}

