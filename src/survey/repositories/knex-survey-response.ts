import { SurveyResponseRepository, ISurveyResponse } from '../survey';
import { KnexTableAdapter } from '../../knex-table-adapter';

export class KnexSurveyResponseRepository implements SurveyResponseRepository {
    private readonly TABLE_NAME = 'survey_response';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async create(surveyResponse: ISurveyResponse): Promise<ISurveyResponse> {
        const query = this._query
            .builder()
            .insert({ ...surveyResponse.toDTO(), updated: new Date().toISOString() })
            .into(this.TABLE_NAME);
        await this._query.executor<ISurveyResponse[]>(query);

        return surveyResponse;
    }
}
