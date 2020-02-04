import { SubmissionId, DtoSubmission, DtoViewSubmission, Submission } from './submission.types';

export class SubmissionEntity implements Submission {
    id: SubmissionId;

    title: string;

    updated: Date;

    // This is wired up so that you can create an entity from the DTO described by ISubmission
    constructor({ id, title, updated }: { id: SubmissionId; title: string; updated?: Date }) {
        this.id = id;
        this.title = title;
        this.updated = updated || new Date();
    }
}

export class SubmissionMapper {
    public static toDto(sub: Submission): DtoSubmission {
        return {
            id: sub.id,
            title: sub.title,
            updated: sub.updated,
        };
    }
    public static toViewDto(sub: Submission): DtoViewSubmission {
        return {
            id: sub.id,
            title: sub.title,
            updated: sub.updated,
        };
    }
    public static fromDto(sub: DtoSubmission): SubmissionEntity {
        return new SubmissionEntity(sub);
    }
}
