import { v4 as uuid } from 'uuid';
import { SurveyResponse } from './survey-response';
import { SurveyResponseId } from '../../types';
import { SubmissionId } from '../../../submission/types';
import { Question } from './question';
import { Answer } from './answer';

const createSurveyResponse = (): SurveyResponse => {
    const id = SurveyResponseId.fromUuid(uuid());
    const surveyId = uuid();
    const submissionId = SubmissionId.fromUuid(uuid());
    const question1 = new Question('1', 'question1');
    const question2 = new Question('2', 'question2');
    const answer1 = new Answer('1', 'answer1');
    const answer2 = new Answer('2', 'answer2');
    const surveyResponse = new SurveyResponse(id, surveyId, submissionId, [question1, question2], [answer1, answer2]);
    return surveyResponse;
};

describe('Survey Entity', () => {
    it('creates a new entity', () => {
        const survey = createSurveyResponse();

        expect(survey.answers).toBeDefined();
        expect(survey.questions.length).toBe(2);
        expect(survey.answers.length).toBe(2);
    });

    it('stores answers correctly', () => {
        const survey = new SurveyResponse(SurveyResponseId.fromUuid(uuid()), uuid(), SubmissionId.fromUuid(uuid()));

        survey.answerQuestion('1', 'question1', 'answer0');
        survey.answerQuestion('1', 'question1', 'answer1');
        survey.answerQuestion('2', 'question2', 'answer2');

        expect(survey.answers[0]).toStrictEqual(new Answer('1', 'answer1'));
        expect(survey.answers[1]).toStrictEqual(new Answer('2', 'answer2'));
        expect(survey.questions[0]).toStrictEqual(new Question('1', 'question1'));
        expect(survey.questions[1]).toStrictEqual(new Question('2', 'question2'));
    });
});
