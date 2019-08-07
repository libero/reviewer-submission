import { v4 as uuid } from 'uuid';
import { Submission } from './submission.entity';
import { SubmissionId } from './submission.repository';

describe('Submission Entity', () => {
  it('creates a new entity properly', () => {
    const id = SubmissionId.fromUuid(uuid());
    const submission = Submission.make(id);

    expect(submission).toBeInstanceOf(Submission);
    expect(submission.title).toBeDefined();
    expect(submission.id).toBe(id);
    expect(submission.updated).toBeDefined();
  });
  it ('changeTitle works', () => {
    const id = SubmissionId.fromUuid(uuid());
    const submission = Submission.make(id);

    submission.changeTitle('foo');

    expect(submission.title).toBe('foo');
  });
});
