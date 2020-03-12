import { SubmissionId } from '../../types';
import File from '../../../file/services/models/file';
import { FileId } from 'src/domain/file/types';
import { FileDTO } from 'src/domain/file/repositories/types';
import { SubmissionDTO } from '../../repositories/types';

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
    manuscriptFile?: File | null;
    supportingFiles?: Array<File>;

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
    }: {
        id: SubmissionId;
        title: string;
        updated?: Date;
        articleType: string;
        status: string;
        createdBy: string;
        manuscriptFile?: File | null;
        supportingFiles?: Array<File>;
    }) {
        this.id = id;
        this.title = title;
        this.updated = updated || new Date();
        this.articleType = this.articleTypeFromString(articleType);
        this.status = status;
        this.createdBy = createdBy;
        this.manuscriptFile = manuscriptFile;
        this.supportingFiles = supportingFiles;
    }

    public toDTO(): SubmissionDTO {
        const { manuscriptFile, supportingFiles, ...rest } = this;

        return {
            ...rest,
            manuscriptFile: manuscriptFile?.toDTO(),
            supportingFiles: supportingFiles ? supportingFiles.forEach(file => file.toDTO()) : []
        };
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

    public getManuscriptFile(): FileDTO | null {
        if (!this.manuscriptFile) {
            return null;
        }

        return this.manuscriptFile.toDTO();
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

    public addSupportingFile(fileId, ...) {
        if (this.supportingFiles?.length > 6) {
            throw new Error('...');
        }

        this.supportingFiles?.push(new File(fileId, ...));
    }
}
