export class Answer {
    readonly questionId: string;
    readonly answer: string;

    constructor(questionId: string, answer: string) {
        this.questionId = questionId;
        this.answer = answer;
    }
}
