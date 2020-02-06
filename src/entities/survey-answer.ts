export class SurveyAnswer {
    readonly questionId: string;
    readonly text: string;
    readonly answer: string;

    public constructor(questionId: string, text: string, answer: string) {
        this.questionId = questionId;
        this.text = text;
        this.answer = answer;
    }
}
