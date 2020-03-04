import { SubmissionId } from '../../types';
import File from '../../../file/services/models/file';

export enum ArticleType {
    RESEARCH_ARTICLE = 'researchArticle',
    FEATURE_ARTICLE = 'featureArticle',
    RESEARCH_ADVANCE = 'researchAdvance',
}

export default class Submission {
    id: SubmissionId;
    title: string;
    updated: Date;
    articleType: ArticleType;
    status: string;
    createdBy: string;
    manuscriptFile?: File;

    // This is wired up so that you can create an entity from the DTO described by ISubmission
    constructor({
        id,
        title,
        updated,
        articleType,
        status,
        createdBy,
        manuscriptFile,
    }: {
        id: SubmissionId;
        title: string;
        updated?: Date;
        articleType: string;
        status: string;
        createdBy: string;
        manuscriptFile?: File;
    }) {
        this.id = id;
        this.title = title;
        this.updated = updated || new Date();
        this.articleType = this.articleTypeFromString(articleType);
        this.status = status;
        this.createdBy = createdBy;
        this.manuscriptFile = manuscriptFile;
    }

    private articleTypeFromString(type: string): ArticleType {
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
