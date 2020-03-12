import { SubmissionId, Details } from '../../types';
import File from '../../../file/services/models/file';
import { SubmissionDTO } from '../../repositories/types';

export enum ArticleType {
    RESEARCH_ARTICLE = 'researchArticle',
    FEATURE_ARTICLE = 'featureArticle',
    RESEARCH_ADVANCE = 'researchAdvance',
}

export default class Submission {
    // This is wired up so that you can create an entity from the DTO described by ISubmission
    constructor({
        id,
        title,
        updated,
        articleType,
        status,
        createdBy,
        manuscriptFile,
        manuscriptDetails,
    }: {
        id: SubmissionId;
        title: string;
        updated?: Date;
        articleType: string;
        status: string;
        createdBy: string;
        manuscriptFile?: File;
        manuscriptDetails?: Details;
    }) {
        this.id = id;
        this.title = title;
        this.updated = updated || new Date();
        this.articleType = Submission.articleTypeFromString(articleType);
        this.status = status;
        this.createdBy = createdBy;
        this.manuscriptFile = manuscriptFile;
        this.manuscriptDetails = manuscriptDetails;
    }

    public static getBlank(id: SubmissionId, userId: string, aType: string): Submission {
        const articleType = Submission.articleTypeFromString(aType);
        return new Submission({
            id,
            title: '',
            updated: new Date(),
            articleType,
            status: 'INITIAL',
            createdBy: userId,
        });
    }

    public toDTO(): SubmissionDTO {
        return new SubmissionDTO({

        });
    }

    public static fromRepo(submission: SubmissionDTO, manuscriptfile, supporting): Submission {
    }

    private static articleTypeFromString(type: string): ArticleType {
        switch (type) {
            case 'researchArticle':
                return ArticleType.RESEARCH_ARTICLE;
            case 'featureArticle':
                return ArticleType.FEATURE_ARTICLE;
            case 'researchAdvance':
                return ArticleType.RESEARCH_ADVANCE;
            default:
                throw new Error('Invalid article type');
        }
    }
}
