import * as Knex from 'knex';
import { SubmissionId, DtoViewSubmission, Submission, Author } from '../submission';
import { KnexSubmissionRepository } from '../infrastructure/knex-submission';
import uuid = require('uuid');
import { SubmissionEntity, SubmissionMapper } from './submission';

export class SubmissionService {
    submissionRepository: KnexSubmissionRepository;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        this.submissionRepository = new KnexSubmissionRepository(knexConnection);
    }

    async findAll(): Promise<DtoViewSubmission[]> {
        return await this.submissionRepository.findAll();
    }

    async saveDetailsPage(id: SubmissionId, details: Author): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (submission === null) {
            throw new Error('Submission not found');
        }
        // @TODO: check against xpub, does this live in meta or somewhere else (including deeper nesting within meta)?
        const savedSubmission = await this.submissionRepository.save({ ...submission, details });
        if (savedSubmission === null) {
            throw new Error('Submission not found');
        }
        return savedSubmission;
    }

    async create(articleType: string, userId: string): Promise<DtoViewSubmission | null> {
        if (!SubmissionService.validateArticleType(articleType)) {
            throw new Error('Invalid article type');
        }
        const id = SubmissionId.fromUuid(uuid());
        const submission = new SubmissionEntity({
            id,
            title: '',
            updated: new Date(),
            articleType,
            status: 'INITIAL',
            createdBy: userId,
        });
        return await this.submissionRepository.insert(submission);
    }

    async findOne(id: SubmissionId): Promise<DtoViewSubmission | null> {
        return await this.submissionRepository.findById(id);
    }

    async changeTitle(id: SubmissionId, title: string): Promise<DtoViewSubmission> {
        const result = await this.submissionRepository.findById(id);
        // A bit duplicated, but let's wait for a pattern to emerge
        if (result === null) {
            throw new Error('Submission not found');
        }
        const resultToSave: Submission = { ...result, title };
        const savedSubmission = await this.submissionRepository.save(resultToSave);
        // A bit duplicated, but let's wait for a pattern to emerge
        if (savedSubmission === null) {
            throw new Error('Submission not found');
        }
        return SubmissionMapper.toViewDto(savedSubmission);
    }

    async delete(id: SubmissionId): Promise<boolean> {
        return await this.submissionRepository.delete(id);
    }

    static validateArticleType(articleType: string): boolean {
        const articlesTypes = ['researchArticle', 'featureArticle', 'researchAdvance'];
        return articlesTypes.includes(articleType);
    }
}
