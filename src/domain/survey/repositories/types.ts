import { SurveyResponse } from '../services/models/survey-response';

export interface SurveyResponseRepository {
    create(surveyResponse: SurveyResponse): Promise<SurveyResponse>;
}
