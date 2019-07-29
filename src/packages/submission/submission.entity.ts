import { Entity, CreateDateColumn, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ISubmission } from './submission.repository';

// This is database logic, that should eventually be decoupled from the interface and moved into
// /src/modules/.

@Entity()
export class Submission implements ISubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  title: string;

  @CreateDateColumn()
  updated: Date;

  // For now, `lastStepVisited` will always be "title"
  static make(id: string) {
    return new Submission(id, '');
  }

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
  }

  changeTitle(title: string) {
    this.title = title;
  }
}
