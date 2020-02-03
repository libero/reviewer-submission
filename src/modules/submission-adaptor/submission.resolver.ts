import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SubmissionId, DtoViewSubmission } from '../../packages/submission/submission.types';
import { SubmissionService } from './submission.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/graphql.guard';

/*
 * Principle - convert to/from dtoView
 */
@Resolver()
export class SubmissionResolver {
    constructor(private readonly submissionService: SubmissionService) {}

    @Query('getSubmissions')
    async getSubmissions(): Promise<DtoViewSubmission[] | null> {
        const result = await this.submissionService.findAll();
        return result.getOrElse(null);
    }

    @Query('getSubmission')
    async getSubmission(@Args('id') id: string): Promise<DtoViewSubmission | null> {
        const result = await this.submissionService.findOne(SubmissionId.fromUuid(id));
        if (result.isEmpty()) {
            return null;
        } else {
            return result.get();
        }
    }

    @Mutation('startSubmission')
    @UseGuards(GqlAuthGuard)
    async startSubmission(@Args('articleType') articleType: string): Promise<DtoViewSubmission | null> {
        const result = await this.submissionService.create(articleType);
        return result.getOrElse(null);
    }

    @Mutation('changeSubmissionTitle')
    async changeSubmissionTitle(
        @Args('id') id: string,
        @Args('title') title: string,
    ): Promise<DtoViewSubmission | null> {
        const result = await this.submissionService.changeTitle(SubmissionId.fromUuid(id), title);
        return result.getOrElse(null);
    }

    @Mutation('deleteSubmission')
    async deleteSubmission(@Args('id') id: SubmissionId): Promise<number> {
        return await this.submissionService.delete(id);
    }
}
