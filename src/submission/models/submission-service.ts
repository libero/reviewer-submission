import * as Knex from 'knex';
import { SubmissionId } from '../submission';
import XpubSubmissionRootRepository from '../infrastructure/xpub-submission-root';
import uuid = require('uuid');
import SubmissionMapper from './SubmissionMapper';
import Submission from './submission';

export class SubmissionService {
    submissionRepository: XpubSubmissionRootRepository;

    constructor(knexConnection: Knex<{}, unknown[]>) {
        this.submissionRepository = new XpubSubmissionRootRepository(knexConnection);
    }

    async findAll(): Promise<Submission[]> {
        const submissions = await this.submissionRepository.findAll();
        return submissions.map(SubmissionMapper.dtoToSubmission);
    }

    async create(articleType: string, userId: string): Promise<Submission> {
        const id = SubmissionId.fromUuid(uuid());
        const submission = new Submission({
            id,
            title: '',
            updated: new Date(),
            articleType,
            status: 'INITIAL',
            createdBy: userId,
        });
        // this works because Submission interface == SubmissionDTO interface. In future we will probably ned a SubmissionToDTO mapper
        const savedSubmissionDTO = await this.submissionRepository.save(submission);

        return SubmissionMapper.dtoToSubmission(savedSubmissionDTO);
    }

    async getSubmission(id: SubmissionId): Promise<Submission> {
        const submissionDTO = await this.submissionRepository.findById(id);
        if (!submissionDTO) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        return SubmissionMapper.dtoToSubmission(submissionDTO);
    }

    async changeTitle(id: SubmissionId, title: string): Promise<Submission> {
        const result = await this.submissionRepository.findById(id);
        if (result === null) {
            throw new Error('Unable to find submission with id: ' + id);
        }
        const submission = SubmissionMapper.dtoToSubmission(result);
        submission.title = title;
        const submissionDTO = await this.submissionRepository.save(submission);
        return SubmissionMapper.dtoToSubmission(submissionDTO);
    }

    async deleteSubmission(id: SubmissionId): Promise<boolean> {
        return await this.submissionRepository.delete(id);
    }
}
