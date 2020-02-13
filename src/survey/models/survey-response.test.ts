import { v4 as uuid } from 'uuid';
import { SurveyResponse } from './survey-response';
import { SurveyId, SurveyResponseId } from '../survey';
import { SubmissionId } from '../../submission/submission';
import { Question } from './question';
import { Answer } from './answer';

const createSurveyResponse = (): SurveyResponse => {
    const id = SurveyResponseId.fromUuid(uuid());
    const surveyId = SurveyId.fromUuid(uuid());
    const submissionId = SubmissionId.fromUuid(uuid());
    const question1 = new Question('1', 'question1');
    const question2 = new Question('2', 'question2');
    const answer1 = new Answer('1', 'answer1');
    const answer2 = new Answer('2', 'answer2');
    const surveyResponse = new SurveyResponse({
        id,
        surveyId,
        submissionId,
        questions: [question1, question2],
        answers: [answer1, answer2],
    });
    return surveyResponse;
};

describe('Survey Entity', () => {
    it('creates a new entity', () => {
        const survey = createSurveyResponse();

        expect(survey).toBeInstanceOf(SurveyResponse);
        expect(survey.answers).toBeDefined();
        expect(survey.questions.length).toBe(2);
        expect(survey.answers.length).toBe(2);
    });

    it('creates the dto', () => {
        const surveyResponse = createSurveyResponse();
        const surveyResponseDTO = surveyResponse.toDTO();

        expect(surveyResponseDTO.response.questions.length).toBe(2);
        expect(surveyResponseDTO.response.answers.length).toBe(2);
        expect(surveyResponseDTO.response.questions[0].id).toBe('1');
        expect(surveyResponseDTO.response.questions[0].question).toBe('question1');
        expect(surveyResponseDTO.response.questions[1].id).toBe('2');
        expect(surveyResponseDTO.response.questions[1].question).toBe('question2');

        expect(surveyResponseDTO.response.answers[0].questionId).toBe('1');
        expect(surveyResponseDTO.response.answers[0].answer).toBe('answer1');
        expect(surveyResponseDTO.response.answers[1].questionId).toBe('2');
        expect(surveyResponseDTO.response.answers[1].answer).toBe('answer2');
    });
});
