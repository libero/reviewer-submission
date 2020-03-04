import { WizardService } from './service';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { SubmissionId } from '../../domain/submission/types';
import { TeamId } from '../../domain/teams/types';
import { FileService } from '../../domain/file/services/file-service';
import { SemanticExtractionService } from 'src/domain/semantic-extraction/services/semantic-extraction-service';

describe('saveDetailsPage', () => {
    it('should throw if submission not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;
        const teamServiceMock = ({
            find: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
        );
        const userId = '89e0aec8-b9fc-4413-8a37-5cc775edqe67';
        await expect(
            wizardService.saveDetailsPage(SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), userId, {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                aff: 'aff',
            }),
        ).rejects.toThrow();
    });

    it('should throw if submission ownership is invalid', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: '3028aab5-ef74-484f-9dfd-aba3f8103f09',
            })),
        } as unknown) as SubmissionService;
        const teamServiceMock = ({
            find: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
        );
        const userId = '89e0aec8-b9fc-4413-8a37-5cc775edqe67';
        await expect(
            wizardService.saveDetailsPage(SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), userId, {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                aff: 'aff',
            }),
        ).rejects.toThrow();
    });

    it('should update when team exists', async () => {
        const userId = '89e0aec8-b9fc-4413-8a37-5cc775edqe67';
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: userId,
            })),
        } as unknown) as SubmissionService;
        const existingTeam = {
            id: TeamId.fromUuid('cda3aef6-0034-4620-b843-1d15b7e815d1'),
        };
        const teamServiceMock = ({
            find: jest.fn().mockImplementationOnce(() => existingTeam),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
        );
        await wizardService.saveDetailsPage(SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), userId, {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            aff: 'aff',
        });

        expect(teamServiceMock.update).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.update).toHaveBeenCalledWith({
            id: existingTeam.id,
            teamMembers: [
                {
                    alias: {
                        firstName: 'John',
                        lastName: 'Smith',
                        email: 'john.smith@example.com',
                        aff: 'aff',
                    },
                    meta: { corresponding: true },
                },
            ],
        });
    });
    it('should create when team does not exist', async () => {
        const userId = '3028aab5-ef74-484f-9dfd-aba3f8103f09';
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: userId,
            })),
        } as unknown) as SubmissionService;
        const existingTeam = null;
        const teamServiceMock = ({
            find: jest.fn().mockImplementationOnce(() => existingTeam),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
        );

        const subId = SubmissionId.fromUuid(userId);
        await wizardService.saveDetailsPage(subId, userId, {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            aff: 'aff',
        });

        expect(teamServiceMock.create).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.create).toHaveBeenCalledWith({
            role: 'author',
            objectId: subId.value,
            objectType: 'manuscript',
            teamMembers: [
                {
                    alias: {
                        firstName: 'John',
                        lastName: 'Smith',
                        email: 'john.smith@example.com',
                        aff: 'aff',
                    },
                    meta: { corresponding: true },
                },
            ],
        });
    });

    it('should throw when userId is not owner', async () => {
        const userId = '89e0aec8-b9fc-4413-8a37-5cc775edqe27';
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc775edqe67',
            })),
        } as unknown) as SubmissionService;
        const existingTeam = {
            id: TeamId.fromUuid('cda3aef6-0034-4620-b843-1d15b7e815d1'),
        };
        const teamServiceMock = ({
            find: jest.fn().mockImplementationOnce(() => existingTeam),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
        );

        await expect(
            wizardService.saveDetailsPage(SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), userId, {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                aff: 'aff',
            }),
        ).rejects.toThrow();
    });
});
