import { Submission, SubmissionId, SubmissionRepository } from './submission.types';
import { SubmissionController } from './submission.controller';
import { Some, None, Option } from 'funfix';
import { v4 } from 'uuid';
import { SubmissionEntity } from './submission.entity';

describe('submission controller', () => {
    const mockSubmissionEntity: Submission = {
        id: SubmissionId.fromUuid(v4()),
        title: "The Importance of Unit Testing One's Controller Logic",
        updated: new Date(),
    };

    const newMockSubmissionRepository = (): SubmissionRepository => ({
        findAll: jest.fn(async () => Option.of([mockSubmissionEntity, mockSubmissionEntity])),
        findById: jest.fn(async () => None),
        save: jest.fn(async (arg: Submission) => Option.of(arg)),
        create: jest.fn(async () =>
            Option.of(
                new SubmissionEntity({
                    id: SubmissionId.fromUuid(v4()),
                    title: '',
                    updated: new Date(),
                }),
            ),
        ),
        delete: jest.fn(async () => 1),
        close: jest.fn(),
        changeTitle: jest.fn(async () => Option.of(mockSubmissionEntity)),
    });

    describe('find all submissions', () => {
        it('finds all submissions', async () => {
            const mockRepo = newMockSubmissionRepository();

            const controller = new SubmissionController(mockRepo);

            const allFound = await controller.findAll();

            expect(mockRepo.findAll).toBeCalledTimes(1);
            expect(allFound.isEmpty()).toBeFalsy();
            expect(allFound.get().length).toBe(2);
        });

        it("returns an empty array when there aren't any submissions", async () => {
            const findAll = jest.fn(async () => Option.of([]));

            const mockRepo = {
                ...newMockSubmissionRepository(),
                findAll,
            };

            const controller = new SubmissionController(mockRepo);

            const allFound = await controller.findAll();

            expect(mockRepo.findAll).toBeCalledTimes(1);
            expect(allFound.isEmpty()).toBeFalsy();
            expect(allFound.get()).toHaveLength(0);
        });
    });

    describe('create new submission', () => {
        it('creates a new submission', async () => {
            const mockRepo = newMockSubmissionRepository();

            const controller = new SubmissionController(mockRepo);

            const newSubmission = await controller.create('researchArticle');
            expect(mockRepo.create).toBeCalledTimes(1);
            expect(newSubmission.isEmpty()).toBeFalsy();
        });
        it('it should throw if type is invalid', async () => {
            const mockRepo = newMockSubmissionRepository();

            const controller = new SubmissionController(mockRepo);
            await expect(controller.create('invalid')).rejects.toThrow();
        });
    });

    describe('findOne submission', () => {
        it("None when it can't find one", async () => {
            const mockRepo = newMockSubmissionRepository();

            const controller = new SubmissionController(mockRepo);

            const found = await controller.findOne(SubmissionId.fromUuid(v4()));

            expect(mockRepo.findById).toBeCalledTimes(1);
            expect(found.isEmpty()).toBeTruthy();
        });

        it("returns it if it's there", async () => {
            const findById = jest.fn(async () => Some(mockSubmissionEntity));

            const mockRepo = {
                ...newMockSubmissionRepository(),
                findById,
            };

            const controller = new SubmissionController(mockRepo);

            const found = await controller.findOne(SubmissionId.fromUuid(v4()));

            expect(findById).toBeCalledTimes(1);
            expect(found.isEmpty()).toBeFalsy();
        });
    });

    describe('changeTitle for a submission', () => {
        it('changes the title', async () => {
            const mr = newMockSubmissionRepository();
            const controller = new SubmissionController(mr);

            const newTitle = 'Some new title';

            const id = SubmissionId.fromUuid(v4());
            const newSubmission = await controller.changeTitle(id, newTitle);

            expect(newSubmission.isEmpty()).toBeFalsy();
            expect(mr.changeTitle).toBeCalledTimes(1);
            expect(mr.changeTitle).toBeCalledWith(id, newTitle);
        });
    });
});
