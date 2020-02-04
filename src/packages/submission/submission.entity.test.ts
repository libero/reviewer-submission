import { v4 as uuid } from 'uuid';
import { SubmissionEntity } from '../../types/submission.entity';
import { SubmissionId } from '../../types/submission.types';

describe('Submission Entity', () => {
    it('creates a new entity properly', () => {
        const id = SubmissionId.fromUuid(uuid());
        const submission = new SubmissionEntity({
            id: id,
            title: '',
            updated: new Date(),
        });

        expect(submission).toBeInstanceOf(SubmissionEntity);
        expect(submission.title).toBeDefined();
        expect(submission.id).toBe(id);
        expect(submission.updated).toBeDefined();
    });
});
