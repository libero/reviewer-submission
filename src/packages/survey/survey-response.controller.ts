import { v4 as uuid } from 'uuid';
import { None, Option } from 'funfix';
import { SurveyResponse } from './survey-response.entity';
import { SurveyResponseRepository, SurveyId, SurveyResponseId } from './survey-response.repository';
import { SurveyAnswer } from './survey-answer';
import { SubmissionId } from '../submission/submission.types';
import { Logger } from '@nestjs/common';

export class SurveyResponseController {
    repository: Option<SurveyResponseRepository> = None;
    private readonly logger = new Logger(SurveyResponseController.name);

    constructor(repository: SurveyResponseRepository) {
        this.repository = Option.of(repository);
    }

    close(): void {
        this.logger.log('Closing repository');
        this.repository.get().close();
        this.repository = None;
    }

    async submitResponse(
        surveyId: SurveyId,
        submissionId: SubmissionId,
        answers: SurveyAnswer[],
    ): Promise<SurveyResponse> {
        const id: SurveyResponseId = SurveyResponseId.fromUuid(uuid());
        const surveyResponse = new SurveyResponse({
            id,
            surveyId,
            submissionId,
        });

        answers.forEach(({ questionId, text, answer }: SurveyAnswer) => {
            surveyResponse.answerQuestion(questionId, text, answer);
        });

        return await this.repository.map(async repository => await repository.save(surveyResponse)).get();
    }
}
