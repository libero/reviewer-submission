import { v4 as uuid } from 'uuid';
import { SubmissionEntity } from './submission';
import { SubmissionId } from '../submission';

describe('Submission Entity', () => {
    it('creates a new entity properly', () => {
        const id = SubmissionId.fromUuid(uuid());
        const submission = new SubmissionEntity({
            id: id,
            title: '',
            status: 'INITIAL',
            createdBy: '123',
            updated: new Date(),
            articleType: '',
        });

        expect(submission).toBeInstanceOf(SubmissionEntity);
        expect(submission.title).toBeDefined();
        expect(submission.id).toBe(id);
        expect(submission.updated).toBeDefined();
    });
});
