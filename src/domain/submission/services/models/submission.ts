import {
    SubmissionId,
    ManuscriptDetails,
    AuthorDetails,
    DisclosureDetails,
    EditorsDetails,
    FileDetails,
} from '../../types';
import File from '../../../file/services/models/file';
import { FileId } from '../../../file/types';
import * as Joi from 'joi';
import { submissionSchema } from './submission-schema';
import logger from '../../../../logger';
import { Suggestion } from '../../../semantic-extraction/services/models/sugestion';

export enum ArticleType {
    RESEARCH_ARTICLE = 'research-article',
    FEATURE_ARTICLE = 'feature',
    RESEARCH_ADVANCE = 'research-advance',
    SCIENTIFIC_CORRESPONDENCE = 'scientific-correspondence',
    TOOLS_RESOURCES = 'tools-resources',
    SHORT_REPORT = 'short-report',
}

export enum SubmissionStatus {
    INITIAL = 'INITIAL',
    MECA_EXPORT_PENDING = 'MECA_EXPORT_PENDING',
    MECA_EXPORT_FAILED = 'MECA_EXPORT_FAILED',
    MECA_EXPORT_SUCCEEDED = 'MECA_EXPORT_SUCCEEDED',
    MECA_IMPORT_FAILED = 'MECA_IMPORT_FAILED',
    MECA_IMPORT_SUCCEEDED = 'MECA_IMPORT_SUCCEEDED',
}

export default class Submission {
    id: SubmissionId;
    created: Date;
    updated: Date;
    articleType: ArticleType;
    status: string;
    createdBy: string;
    lastStepVisited?: string;

    author?: AuthorDetails; // responsibility of the Teams Service
    manuscriptDetails: ManuscriptDetails = {};
    files: FileDetails = {}; // responsibility of the Files Service
    editors: EditorsDetails = {};
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
        created?: Date;
        updated?: Date;
        articleType: string;
        status: string;
        createdBy: string;
    }) {
        this.id = id;
        this.created = created || new Date();
        this.updated = updated || new Date();
        this.articleType = this.articleTypeFromString(articleType);
        this.status = status;
        this.createdBy = createdBy;
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

    public setManuscriptFile(fileId: FileId, filename: string, mimeType: string, fileSize: number): void {
        if (!this.files) {
            throw new Error('Object invalid! No files member.');
        }

        if (this.files.manuscriptFile) {
            throw new Error('Manuscript file already present');
        }

        this.files.manuscriptFile = File.makeManuscriptFile(fileId, this.id, filename, mimeType, fileSize);
    }

    public getManuscriptFile(): File | null {
        if (!this.files.manuscriptFile) {
            return null;
        }

        return this.files.manuscriptFile;
    }

    public setManuscriptFileStatusToStored(): void {
        if (this.files.manuscriptFile) {
            this.files.manuscriptFile.setStatusToStored();
        }
    }

    public setManuscriptFileStatusToCancelled(): void {
        if (this.files.manuscriptFile) {
            this.files.manuscriptFile.setStatusToCancelled();
        }
    }

    public isSubmittable(): boolean {
        const { error: errorManuscript } = Joi.validate(this, submissionSchema);
        if (errorManuscript) {
            logger.error(`Bad manuscript data: ${errorManuscript}`);
            throw new Error(errorManuscript.message);
        }
        return true;
    }
}
