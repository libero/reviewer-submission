import * as Knex from 'knex';
import { SubmissionId, Details } from '../types';
import XpubSubmissionRootRepository from '../repositories/xpub-submission-root';
import { v4 as uuid } from 'uuid';
import Submission from './models/submission';
import { SubmissionDTO } from '../repositories/types';
import { createKnexAdapter } from '../../knex-table-adapter';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;

    constructor(knex: Knex<{}, unknown[]>) {
        const adapter = createKnexAdapter(knex, 'public');
        this.submissionRepository = new XpubSubmissionRootRepository(adapter);
    }

    async getEntireSubmission(): Promise<Submission> {
        // get via many services
    }

    async findAll(): Promise<Submission[]> {
        const submissions = await this.submissionRepository.findAll();
        return submissions.map((dto: SubmissionDTO) => new Submission(dto));
    }

    async findByUserId(userId: string): Promise<Submission[]> {
        const submissions = await this.submissionRepository.findByUserId(userId);
        return submissions.map((dto: SubmissionDTO) => new Submission(dto));
    }

    async create(articleType: string, userId: string): Promise<Submission> {
        const id = SubmissionId.fromUuid(uuid());
        const submission = Submission.getBlank(id, userId, articleType);
        const savedSubmissionDTO = await this.submissionRepository.create(submission.toDTO());
        return new Submission(savedSubmissionDTO);
    }

    async saveManuscriptDetails(id: SubmissionId, details: Details): Promise<Submission> {
        const submissionDTO = await this.getEntireSubmission(id); // uses other services to get the DTO's and then construct a Submission

        // const submissionDTO = await this.submissionRepository.findById(id);
        if (!submissionDTO) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        const newDTO = { ...submissionDTO, ...details };
        const returnedDTO = await this.submissionRepository.update(newDTO);
        return new Submission(returnedDTO);
    }

    async get(id: SubmissionId): Promise<Submission> {
        const submissionDTO = await this.submissionRepository.findById(id);
        if (!submissionDTO) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        return new Submission(submissionDTO);
    }

    async delete(id: SubmissionId): Promise<boolean> {
        return await this.submissionRepository.delete(id);
    }
}
