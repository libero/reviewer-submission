import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Option, None } from 'funfix';
import { SubmissionRepository, SubmissionId, Submission } from '../types/submission';

// TODO: this is temporary until the picture on validation and article types is clearer.
const articlesTypes = ['researchArticle', 'featureArticle', 'researchAdvance'];

export class SubmissionController {
    private readonly logger = new Logger(SubmissionController.name);

    constructor(readonly repository: SubmissionRepository) {}

    close(): void {
        this.logger.log('Closing repository');
        this.repository.close();
    }

    async findAll(): Promise<Option<Submission[]>> {
        return new Promise(async resolve => {
            const result: Option<Submission[]> = await this.repository.findAll();
            if (result.isEmpty()) {
                resolve(None);
            } else {
                resolve(Option.of(result.get()));
            }
        });
    }

    async create(articleType: string): Promise<Option<Submission>> {
        if (!articlesTypes.includes(articleType)) {
            throw new HttpException('Unprocessable entity', HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return this.repository.create(articleType);
    }

    async findOne(id: SubmissionId): Promise<Option<Submission>> {
        return this.repository.findById(id);
    }

    async changeTitle(id: SubmissionId, title: string): Promise<Option<Submission>> {
        return this.repository.changeTitle(id, title);
    }

    async delete(id: SubmissionId): Promise<number> {
        return this.repository.delete(id);
    }
}
