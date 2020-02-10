import { SubmissionId, DtoSubmission, DtoViewSubmission, Submission } from '../types/submission';

export class SubmissionEntity implements Submission {
    id: SubmissionId;

    title: string;

    updated: Date;

    articleType: string;

    // This is wired up so that you can create an entity from the DTO described by ISubmission
    constructor({
        id,
        title,
        updated,
        articleType,
    }: {
        id: SubmissionId;
        title: string;
        updated?: Date;
        articleType: string;
    }) {
        this.id = id;
        this.title = title;
        this.updated = updated || new Date();
        this.articleType = articleType;
    }
}

export class SubmissionMapper {
    public static toDto(sub: Submission): DtoSubmission {
        return {
            id: sub.id,
            title: sub.title,
            updated: sub.updated,
            meta: {
                articleType: sub.articleType,
            }
        };
    }
    public static toViewDto(sub: Submission): DtoViewSubmission {
        return {
            id: sub.id,
            title: sub.title,
            updated: sub.updated,
            articleType: sub.articleType,
        };
    }
    public static fromDto(sub: DtoSubmission): SubmissionEntity {
        const mappedSubmissionDto: Submission = { 
            ...sub,
            articleType: SubmissionMapper.getMetaValue(sub, 'articleType')
        };
        return new SubmissionEntity(mappedSubmissionDto);
    }

    static getMetaValue(sub: DtoSubmission, metaProperty: string): string {
        try {
            return (sub.meta as { [key: string]: string })[metaProperty];
        }catch(_) {
            throw new Error(`Unable to find property ${metaProperty} on DtoSubmission`);
        }
    }
}
