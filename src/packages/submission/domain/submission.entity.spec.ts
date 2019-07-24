import { v4 as uuid } from 'uuid';
import { Submission } from './submission.entity';

describe('Submission Entity', () => {
  it ('changeTitle works', () => {
    const submission = Submission.make(uuid())

    submission.changeTitle('foo')

    expect(submission.title).toBe('foo')
  })
})
