export class Question {
    readonly id: string;
    readonly question: string;

    constructor(id: string, question: string) {
        this.id = id;
        this.question = question;
    }
}
