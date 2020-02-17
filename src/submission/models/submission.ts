import { SubmissionId, DtoSubmission, DtoViewSubmission, Submission, xpubMeta } from '../submission';
import { Author } from '../people';

export class SubmissionEntity implements Submission {
    id: SubmissionId;

    title: string;

    updated: Date;

    articleType: string;

    status: string;

    createdBy: string;

    details?: Author;

    // This is wired up so that you can create an entity from the DTO described by ISubmission
    constructor({
        id,
        title,
        updated,
        articleType,
        status,
        createdBy,
        details,
    }: {
        id: SubmissionId;
        title: string;
        updated?: Date;
        articleType: string;
        status: string;
        createdBy: string;
        details?: Author;
    }) {
        this.id = id;
        this.title = title;
        this.updated = updated || new Date();
        this.articleType = articleType;
        this.status = status;
        this.createdBy = createdBy;
        this.details = details;
    }
}

export class SubmissionMapper {
    public static toDto(sub: Submission): DtoSubmission {
        return {
            id: sub.id,
            updated: sub.updated,
            details: sub.details,
            // eslint-disable-next-line @typescript-eslint/camelcase
            created_by: sub.createdBy,
            status: sub.status,
            meta: {
                articleType: sub.articleType,
                title: sub.title,
            },
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
        // eslint-disable-next-line @typescript-eslint/camelcase
        const { created_by, meta, ...rest } = sub;
        const mappedSubmissionDto: Submission = {
            ...rest,
            // eslint-disable-next-line @typescript-eslint/camelcase
            createdBy: created_by,
            title: SubmissionMapper.getMetaValue(meta, 'title'),
            articleType: SubmissionMapper.getMetaValue(meta, 'articleType'),
        };

        return new SubmissionEntity(mappedSubmissionDto);
    }

    static getMetaValue(meta: xpubMeta, metaProperty: string): string {
        try {
            return (meta as { [key: string]: string })[metaProperty];
        } catch (_) {
            throw new Error(`Unable to find property ${metaProperty} on DtoSubmission`);
        }
    }
}
