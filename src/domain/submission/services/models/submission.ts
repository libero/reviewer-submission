import {
    SubmissionId,
    ManuscriptDetails,
    AuthorDetails,
    DisclosureDetails,
    EditorDetails,
    FileDetails,
} from '../../types';
import { submissionSchema } from './submission-schema';
import logger from '../../../../logger';
import { Suggestion } from '../../../semantic-extraction/types';

export enum ArticleType {
    RESEARCH_ARTICLE = 'research-article',
    FEATURE_ARTICLE = 'feature',
    RESEARCH_ADVANCE = 'research-advance',
    SCIENTIFIC_CORRESPONDENCE = 'scientific-correspondence',
    TOOLS_RESOURCES = 'tools-resources',
    SHORT_REPORT = 'short-report',
    // this is needed due to xpub migration issues
    EMPTY = '',
}

export default class Submission {
    id: SubmissionId;
    created: string;
    updated: string;
    articleType: ArticleType;
    status: string;
    createdBy: string;
    lastStepVisited?: string;

    author?: AuthorDetails; // responsibility of the Teams Service
    manuscriptDetails: ManuscriptDetails = {};
    files: FileDetails = {}; // responsibility of the Files Service
    editorDetails: EditorDetails = {};
    disclosure: DisclosureDetails = {};
    suggestions?: Array<Suggestion> = [];

    // This is wired up so that you can create an entity from the DTO described by ISubmission
    constructor({
        id,
        created,
        updated,
        articleType,
        status,
        createdBy,
    }: {
        id: SubmissionId;
        created?: string;
        updated?: string;
        articleType: string;
        status: string;
        createdBy: string;
    }) {
        this.id = id;
        this.created = created || new Date().toISOString();
        this.updated = updated || new Date().toISOString();
        this.articleType = this.articleTypeFromString(articleType);
        this.status = status;
        this.createdBy = createdBy;
    }

    private articleTypeFromString(type: string): ArticleType {
        switch (type) {
            case 'research-article':
                return ArticleType.RESEARCH_ARTICLE;
            case 'feature':
                return ArticleType.FEATURE_ARTICLE;
            case 'research-advance':
                return ArticleType.RESEARCH_ADVANCE;
            case 'scientific-correspondence':
                return ArticleType.SCIENTIFIC_CORRESPONDENCE;
            case 'tools-resources':
                return ArticleType.TOOLS_RESOURCES;
            case 'short-report':
                return ArticleType.SHORT_REPORT;
            case '':
                return ArticleType.EMPTY;
            default:
                throw new Error('Invalid article type');
        }
    }

    public addOppositionReasons(
        opposedReviewersReason?: string,
        opposedReviewingEditorsReason?: string,
        opposedSeniorEditorsReason?: string,
    ): void {
        this.editorDetails.opposedReviewersReason = opposedReviewersReason;
        this.editorDetails.opposedReviewingEditorsReason = opposedReviewingEditorsReason;
        this.editorDetails.opposedSeniorEditorsReason = opposedSeniorEditorsReason;
    }

    public isSubmittable(): boolean {
        const { error } = submissionSchema.validate(this);
        if (error) {
            logger.error(`Bad manuscript data: ${error}`);
            throw new Error(error.message);
        }
        return true;
    }
}
