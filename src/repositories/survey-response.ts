import * as Knex from 'knex';
import { SurveyResponseRepository, ISurveyResponse } from '../types/survey';

export class KnexSurveyResponseRepository implements SurveyResponseRepository {
    private readonly TABLE_NAME = 'survey_response';

    public constructor(private readonly knex: Knex<{}, unknown[]>) {}

    public async save(surveyResponse: ISurveyResponse): Promise<ISurveyResponse> {
        await this.knex(this.TABLE_NAME).insert({ ...surveyResponse.toDTO(), updated: new Date().toISOString() });
        return surveyResponse;
    }

    close(): void {
        this.knex.destroy();
    }
}
