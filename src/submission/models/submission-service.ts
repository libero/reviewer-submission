import * as Knex from 'knex';
import { SubmissionId, DtoViewSubmission, Submission } from '../submission';
import { KnexSubmissionRepository } from '../infrastructure/knex-submission';
import { KnexTeamRepository } from '../infrastructure/knex-team';
import uuid = require('uuid');
import { SubmissionEntity, SubmissionMapper } from './submission';
import { Author } from '../team';

export class SubmissionService {
    submissionRepository: KnexSubmissionRepository;
    teamRepository: KnexTeamRepository;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        // TODO: Use a different connection in future
        this.submissionRepository = new KnexSubmissionRepository(knexConnection);
        this.teamRepository = new KnexTeamRepository(knexConnection);
    }

    async findAll(): Promise<DtoViewSubmission[]> {
        return await this.submissionRepository.findAll();
    }

    async saveDetailsPage(id: SubmissionId, details: Author): Promise<Submission> {
        const submission = await this.submissionRepository.findById(id);
        if (submission === null) {
            throw new Error('Submission not found');
        }
        const savedSubmission = await this.submissionRepository.update({ ...submission });
        if (savedSubmission === null) {
            throw new Error('Submission not found');
        }

        // Also now need to up date the Team repository
        // const savedAuthor = await this.teamRepository.update(submission.id, 'manuscript', details, 'author');

        return savedSubmission;
    }

    // returning of this function is wrong!
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
        return await this.submissionRepository.create(submission);
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
        const savedSubmission = await this.submissionRepository.update(resultToSave);
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
