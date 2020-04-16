import { FileUpload } from 'graphql-upload';
import { PubSub } from 'apollo-server-express';
import { Config } from '../../config';
import { WizardService } from './service';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { SubmissionId } from '../../domain/submission/types';
import { TeamId } from '../../domain/teams/types';
import { PermissionService } from '../permission/service';
import { FileService } from '../../domain/file/services/file-service';
import { SemanticExtractionService } from '../../domain/semantic-extraction/services/semantic-extraction-service';
import { Suggestion } from '../../domain/semantic-extraction/services/models/sugestion';

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('{}'),
}));

describe('saveAuthorPage', () => {
    const mockConfig = ({} as unknown) as Config;
    it('should throw if submission not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;
        const teamServiceMock = ({
            find: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const permissionService = new PermissionService();

        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );
        const user = {
            id: '89e0aec8-b9fc-4413-8a37-5cc77567',
            name: 'Bob',
            role: 'user',
        };
        await expect(
            wizardService.saveAuthorPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
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

        const permissionService = new PermissionService();
        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );
        const user = {
            id: '89e0aec8-b9fc-4413-8a37-5cc77567',
            name: 'Bob',
            role: 'user',
        };
        await expect(
            wizardService.saveAuthorPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                aff: 'aff',
            }),
        ).rejects.toThrow();
    });

    it('should update when team exists', async () => {
        const user = {
            id: '89e0aec8-b9fc-4413-8a37-5cc77567',
            name: 'Bob',
            role: 'user',
        };

        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: user.id,
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
        const permissionService = new PermissionService();
        const suggestion: Suggestion = { fieldName: 'title', value: 'title' };
        const semanticExtractionServiceMock = ({
            getSuggestion: jest.fn().mockReturnValue([suggestion]),
        } as unknown) as SemanticExtractionService;

        const fileService = ({
            findManuscriptFile: jest.fn(),
            getSupportingFiles: jest.fn().mockReturnValue([]),
        } as unknown) as FileService;
        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileService,
            semanticExtractionServiceMock,
            mockConfig,
        );
        await wizardService.saveAuthorPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
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
        const user = {
            id: '89e0aec8-b9fc-4413-8a37-5cc77567',
            name: 'Bob',
            role: 'user',
        };
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: user.id,
            })),
        } as unknown) as SubmissionService;
        const existingTeam = null;
        const teamServiceMock = ({
            find: jest.fn().mockImplementationOnce(() => existingTeam),
            update: jest.fn(),
            createAuthor: jest.fn(),
        } as unknown) as TeamService;

        const permissionService = new PermissionService();
        const suggestion: Suggestion = { fieldName: 'title', value: 'title' };
        const semanticExtractionServiceMock = ({
            getSuggestion: jest.fn().mockReturnValue([suggestion]),
        } as unknown) as SemanticExtractionService;
        const subId = SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a');

        const fileService = ({
            findManuscriptFile: jest.fn(),
            getSupportingFiles: jest.fn().mockReturnValue([]),
        } as unknown) as FileService;
        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileService,
            semanticExtractionServiceMock,
            mockConfig,
        );

        await wizardService.saveAuthorPage(user, subId, {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            aff: 'aff',
        });

        expect(teamServiceMock.createAuthor).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.createAuthor).toHaveBeenCalledWith(
            'author',
            [
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
            subId.toString(),
            'manuscript',
        );
    });

    it('should throw when userId is not owner', async () => {
        const user = {
            id: '89e0aec8-b9fc-4413-8a37-cccccccc',
            name: 'Bob',
            role: 'user',
        };
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
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

        const permissionService = new PermissionService();
        const fileServiceMock = (jest.fn() as unknown) as FileService;
        const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );

        await expect(
            wizardService.saveAuthorPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                aff: 'aff',
            }),
        ).rejects.toThrow();
    });
});

describe('saveManuscript', () => {
    const mockUser = {
        id: '89e0aec8-b9fc-4413-8a37-cccccccc',
        name: 'Bob',
        role: 'user',
    };
    const mockConfig = ({
        // eslint-disable-next-line @typescript-eslint/camelcase
        max_file_size_in_bytes: 100,
    } as unknown) as Config;

    it('should throw if user is not allowed to update submission', async (): Promise<void> => {
        const permissionService = ({
            userCanWithSubmission: jest.fn(() => false),
        } as unknown) as PermissionService;

        const wizardService = new WizardService(
            permissionService,
            ({ get: jest.fn(() => Promise.resolve()) } as unknown) as SubmissionService,
            (jest.fn() as unknown) as TeamService,
            (jest.fn() as unknown) as FileService,
            (jest.fn() as unknown) as SemanticExtractionService,
            mockConfig,
        );
        await expect(
            wizardService.saveManuscriptFile(
                mockUser,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                (jest.fn() as unknown) as FileUpload,
                0,
                (jest.fn() as unknown) as PubSub,
            ),
        ).rejects.toThrow('User not allowed to save submission');
    });

    it('should throw if the file size is greater than the max in config', async (): Promise<void> => {
        const mockFileSize = mockConfig.max_file_size_in_bytes + 1;
        const permissionService = ({
            userCanWithSubmission: jest.fn(() => true),
        } as unknown) as PermissionService;

        const wizardService = new WizardService(
            permissionService,
            ({ get: jest.fn(() => Promise.resolve()) } as unknown) as SubmissionService,
            (jest.fn() as unknown) as TeamService,
            (jest.fn() as unknown) as FileService,
            (jest.fn() as unknown) as SemanticExtractionService,
            mockConfig,
        );
        await expect(
            wizardService.saveManuscriptFile(
                mockUser,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                (jest.fn() as unknown) as FileUpload,
                mockFileSize,
                (jest.fn() as unknown) as PubSub,
            ),
        ).rejects.toThrow('File truncated as it exceeds the 100 byte size limit.');
    });
});

describe('saveSupporting', () => {
    const mockUser = {
        id: '89e0aec8-b9fc-4413-8a37-cccccccc',
        name: 'Bob',
        role: 'user',
    };
    const mockConfig = ({
        // eslint-disable-next-line @typescript-eslint/camelcase
        max_file_size_in_bytes: 100,
    } as unknown) as Config;

    it('should throw if user is not allowed to update submission', async (): Promise<void> => {
        const permissionService = ({
            userCanWithSubmission: jest.fn(() => false),
        } as unknown) as PermissionService;

        const wizardService = new WizardService(
            permissionService,
            ({ get: jest.fn(() => Promise.resolve()) } as unknown) as SubmissionService,
            (jest.fn() as unknown) as TeamService,
            (jest.fn() as unknown) as FileService,
            (jest.fn() as unknown) as SemanticExtractionService,
            mockConfig,
        );
        await expect(
            wizardService.saveSupportingFile(
                mockUser,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                (jest.fn() as unknown) as FileUpload,
                0,
                (jest.fn() as unknown) as PubSub,
            ),
        ).rejects.toThrow('User not allowed to save submission');
    });
    it('should throw if the file size is greater than the max in config', async (): Promise<void> => {
        const mockFileSize = mockConfig.max_file_size_in_bytes + 1;
        const permissionService = ({
            userCanWithSubmission: jest.fn(() => true),
        } as unknown) as PermissionService;

        const wizardService = new WizardService(
            permissionService,
            ({ get: jest.fn(() => Promise.resolve()) } as unknown) as SubmissionService,
            (jest.fn() as unknown) as TeamService,
            (jest.fn() as unknown) as FileService,
            (jest.fn() as unknown) as SemanticExtractionService,
            mockConfig,
        );
        await expect(
            wizardService.saveSupportingFile(
                mockUser,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                (jest.fn() as unknown) as FileUpload,
                mockFileSize,
                (jest.fn() as unknown) as PubSub,
            ),
        ).rejects.toThrow('File truncated as it exceeds the 100 byte size limit.');
    });
});
