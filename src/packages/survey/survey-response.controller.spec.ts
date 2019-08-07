import { SurveyResponseController } from './survey-response.controller';
import { SurveyResponseDTO, SurveyResponseId, SurveyId} from './survey-response.repository';
import { SubmissionId} from '../submission/submission.repository';
import { SurveyResponse } from './survey-response.entity';
import { SurveyAnswer } from './survey-answer';
import { v4 } from 'uuid';
import { None } from 'funfix';

describe('Survey Controller', () => {
  describe('submitResponse', () => {
    const exampleSurveyResponse: SurveyResponseDTO = {
      id: SurveyResponseId.fromUuid(v4()),
      surveyId: SurveyId.fromUuid(v4()),
      submissionId: SubmissionId.fromUuid(v4()),
      response: {
        questions: [],
        answers: [],
      },
    };

    const newSurveyResponseRepo = () => ({
      save: jest.fn(async (thing) => (thing || new SurveyResponse(exampleSurveyResponse))),
    });

    it('errors when there isn\'t a repo', async () => {

      const controller = new SurveyResponseController(newSurveyResponseRepo());
      controller.repository = None;

      expect(controller.submitResponse(SurveyId.fromUuid(v4()), SubmissionId.fromUuid(v4()), [])).rejects.toThrow();
    });

    it('saves the correct data', async () => {
      const repo = newSurveyResponseRepo();
      const controller = new SurveyResponseController(repo);

      const surveyId = SurveyId.fromUuid(v4());
      const submissionId = SubmissionId.fromUuid(v4());

      const [question1Id, question2Id, question3Id, question4Id] = [v4(), v4(), v4(), v4()];

      const surveyAnswers = [
        new SurveyAnswer(question1Id, 'question 1', 'answer 1'),
        new SurveyAnswer(question2Id, 'question 2', 'answer 2'),
        new SurveyAnswer(question3Id, 'question 3', 'answer 3'),
        new SurveyAnswer(question4Id, 'question 4', 'answer 4'),
      ];

      const response = await controller.submitResponse(surveyId, submissionId, surveyAnswers);

      const expectedResult = {
        id: response.id,
        surveyId,
        submissionId,
        questions: [
          {
            id: question1Id,
            question: 'question 1',
          },
          {
            id: question2Id,
            question: 'question 2',
          },
          {
            id: question3Id,
            question: 'question 3',
          },
          {
            id: question4Id,
            question: 'question 4',
          },
        ],
        answers: [
          {
            questionId: question1Id,
            answer: 'answer 1',
          },
          {
            questionId: question2Id,
            answer: 'answer 2',
          },
          {
            questionId: question3Id,
            answer: 'answer 3',
          },
          {
            questionId: question4Id,
            answer: 'answer 4',
          },

        ],
      };

      // JSON.stringify because JEST asserts on object instances and I ain't got time fo dat
      expect(JSON.stringify(repo.save.mock.calls)).toEqual(JSON.stringify([[expectedResult]]));
      expect(repo.save.mock.calls.length).toBe(1);
    });
  });
});
