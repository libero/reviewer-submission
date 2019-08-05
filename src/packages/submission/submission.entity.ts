import { ISubmission } from './submission.repository';

export class Submission implements ISubmission {
  id: string;

  title: string;

  updated: Date;

  // For now, `lastStepVisited` will always be "title"
  public static make(id: string): Submission {
    return new Submission({id, title: '', updated: new Date()});
  }

  // This is wired up so that you can create an entity from the DTO described by ISubmission
  constructor({id, title, updated}: {id: string, title: string, updated?: Date}) {
    this.id = id;
    this.title = title;
    this.updated = updated || new Date();
  }

  public changeTitle(title: string) {
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
