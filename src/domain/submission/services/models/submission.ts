import { SubmissionId } from '../../types';
import File from '../../../file/services/models/file';
import { FileId } from 'src/domain/file/types';
import * as Joi from 'joi';
import { submissionSchema } from './submission-schema';
import logger from '../../../../logger';

export enum ArticleType {
    RESEARCH_ARTICLE = 'researchArticle',
    FEATURE_ARTICLE = 'featureArticle',
    RESEARCH_ADVANCE = 'researchAdvance',
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
    title: string;
    updated: Date;
    articleType: ArticleType;
    status: string;
    createdBy: string;
    manuscriptFile?: File | null;
    supportingFiles?: Array<File>;
    coverLetter?: string;

    // This is wired up so that you can create an entity from the DTO described by ISubmission
    constructor({
        id,
        title,
        updated,
        articleType,
        status,
        createdBy,
        manuscriptFile,
        supportingFiles,
        coverLetter,
    }: {
        id: SubmissionId;
        title: string;
        updated?: Date;
        articleType: string;
        status: string;
        createdBy: string;
        manuscriptFile?: File | null;
        supportingFiles?: Array<File>;
        coverLetter?: string;
    }) {
        this.id = id;
        this.title = title;
        this.updated = updated || new Date();
        this.articleType = this.articleTypeFromString(articleType);
        this.status = status;
        this.createdBy = createdBy;
        this.manuscriptFile = manuscriptFile;
        this.supportingFiles = supportingFiles;
        this.coverLetter = coverLetter;
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
        if (!this.manuscriptFile) {
            throw new Error('Manuscript file already present');
        }

        this.manuscriptFile = File.makeManuscriptFile(fileId, this.id, filename, mimeType, fileSize);
    }

    public getManuscriptFile(): File | null {
        if (!this.manuscriptFile) {
            return null;
        }

        return this.manuscriptFile;
    }

    public setManuscriptFileStatusToStored(): void {
        if (this.manuscriptFile) {
            this.manuscriptFile.setStatusToStored();
        }
    }

    public setManuscriptFileStatusToCancelled(): void {
        if (this.manuscriptFile) {
            this.manuscriptFile.setStatusToCancelled();
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
