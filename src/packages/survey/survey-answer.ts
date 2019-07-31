export class SurveyAnswer {
  readonly questionId;

  readonly text;

  readonly answer;

  public constructor(questionId: string, text: string, answer: string) {
    this.questionId = questionId;
    this.text = text;
    this.answer = answer;
  }
}
