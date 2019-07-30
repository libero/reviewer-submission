import { ISubmission } from './submission.repository';

export class Submission implements ISubmission {
  id: string;

  title: string;

  updated: Date;

  // For now, `lastStepVisited` will always be "title"
  static make(id: string) {
    return new Submission({id, title: '', updated: new Date()});
  }

  // This is wired up so that you can create an entity from the DTO described by ISubmission
  constructor({id, title}: ISubmission) {
    this.id = id;
    this.title = title;
  }

  changeTitle(title: string) {
    this.title = title;
  }

  public toDTO(): ISubmission {
    return {
      id: this.id,
      title: this.title,
      updated: this.updated,
    };
  }
}
