/* eslint-disable @typescript-eslint/camelcase */
import { SurveyResponseId } from '../types';
import { SurveyResponseRepository } from './types';
import { KnexTableAdapter } from '../../knex-table-adapter';
import { SurveyResponse } from '../services/models/survey-response';
import { SubmissionId } from 'src/domain/submission/types';
import { Question } from '../services/models/question';
import { Answer } from '../services/models/answer';

type DatabaseEntry = {
    id: SurveyResponseId;
    survey_id: string;
    manuscript_id: SubmissionId;
    response: {
        questions: Question[];
        answers: Answer[];
    };
    created?: string;
    updated?: string;
};

export class KnexSurveyResponseRepository implements SurveyResponseRepository {
    private readonly TABLE_NAME = 'survey_response';

    public constructor(private readonly _query: KnexTableAdapter) {}

    public async create(surveyResponse: SurveyResponse): Promise<SurveyResponse> {
        const currentTimeStamp = new Date();
        surveyResponse.created = currentTimeStamp;
        surveyResponse.updated = currentTimeStamp;
        const query = this._query
            .builder()
            .insert({ ...this.modelToEntry(surveyResponse) })
            .into(this.TABLE_NAME);
        await this._query.executor<SurveyResponse[]>(query);

        return surveyResponse;
    }

    private modelToEntry(surveyResponse: SurveyResponse): DatabaseEntry {
        const {
            created,
            updated,
            surveyId: survey_id,
            submissionId: manuscript_id,
            questions,
            answers,
            ...rest
        } = surveyResponse;

        return {
            ...rest,
            response: {
                questions,
                answers,
            },
            survey_id,
            manuscript_id,
            created: created?.toISOString(),
            updated: updated?.toISOString(),
        };
    }

    private entryToModel(record: DatabaseEntry): SurveyResponse {
        return new SurveyResponse(
            record.id,
            record.survey_id,
            record.manuscript_id,
            record.response.questions,
            record.response.answers,
        );
    }
}
