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
import { Suggestion } from '../../domain/semantic-extraction/types';
import File from '../../domain/file/services/models/file';
import { FileId, FileType } from '../../domain/file/types';

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('{}'),
}));
jest.mock('../../logger');

describe('getSubmission', () => {
    const mockConfig = ({} as unknown) as Config;
    it('it should return an exception if submission is not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;
        const teamServiceMock = (jest.fn() as unknown) as TeamService;

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
            wizardService.getSubmission(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a')),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-10Dc77567',
            })),
        } as unknown) as SubmissionService;
        const teamServiceMock = (jest.fn() as unknown) as TeamService;

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
            id: '89e0aec8-b9fc-4413-8a37-5cc77567', // imposter
            name: 'Bob',
            role: 'user',
        };

        await expect(
            wizardService.getSubmission(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a')),
        ).rejects.toThrow('User not allowed to read submission');
    });

    it('it should return the full submission', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementation(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
                files: [],
            })),
        } as unknown) as SubmissionService;
        const teamServiceMock = ({ findTeams: jest.fn().mockImplementation(() => []) } as unknown) as TeamService;

        const permissionService = new PermissionService();

        const fileServiceMock = ({
            findManuscriptFile: jest.fn().mockImplementation(() => null),
            getSupportingFiles: jest.fn().mockImplementation(() => []),
        } as unknown) as FileService;
        const semanticExtractionServiceMock = ({
            getSuggestion: jest.fn().mockImplementation(() => null),
        } as unknown) as SemanticExtractionService;
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

        const submission = await wizardService.getSubmission(
            user,
            SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
        );
        const { files = null } = submission || {};
        expect(submission).toBeDefined();
        expect(submission?.createdBy).toBe('89e0aec8-b9fc-4413-8a37-5cc77567');
        expect(files).toBeDefined();
    });
});

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
        ).rejects.toThrow('No submission found');
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
        ).rejects.toThrow('User not allowed to save submission');
    });

    it('should update when team exists', async () => {
        const user = {
            id: '89e0aec8-b9fc-4413-8a37-5cc77567',
            name: 'Bob',
            role: 'user',
        };

        const submissionServiceMock = ({
            saveAuthorDetails: jest.fn(),
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: user.id,
            })),
        } as unknown) as SubmissionService;
        const existingTeam = {
            id: TeamId.fromUuid('cda3aef6-0034-4620-b843-1d15b7e815d1'),
        };
        const teamServiceMock = ({
            find: jest.fn().mockImplementationOnce(() => existingTeam),
            updateOrCreateAuthor: jest.fn(),
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

        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledWith('89e0aec8-b9fc-4413-8a37-5cc775edbe3a', {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            aff: 'aff',
        });
        expect(submissionServiceMock.saveAuthorDetails).toBeCalledTimes(1);
    });
    it('should create when team does not exist', async () => {
        const user = {
            id: '89e0aec8-b9fc-4413-8a37-5cc77567',
            name: 'Bob',
            role: 'user',
        };
        const submissionServiceMock = ({
            saveAuthorDetails: jest.fn(),
            get: jest.fn().mockImplementationOnce(() => ({
                createdBy: user.id,
            })),
        } as unknown) as SubmissionService;
        const existingTeam = null;
        const teamServiceMock = ({
            updateOrCreateAuthor: jest.fn(),
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

        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledWith(subId.toString(), {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            aff: 'aff',
        });
        expect(submissionServiceMock.saveAuthorDetails).toBeCalledTimes(1);
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
        ).rejects.toThrow('User not allowed to save submission');
    });
});

// TODO: write tests
describe('saveEditorPage', () => {});

// TODO: write tests
describe('saveDisclosurePage', () => {});

// TODO: write tests
describe('submit', () => {});

// TODO: write tests
describe('deleteManuscriptFile', () => {});

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

    it('sets file to cancelled and throws if the upload process fails', async (): Promise<void> => {
        const permissionService = ({
            userCanWithSubmission: jest.fn(() => true),
        } as unknown) as PermissionService;

        const mockFileService = ({
            create: jest.fn(),
            uploadManuscript: jest.fn(() => Promise.reject('test error')),
        } as unknown) as FileService;

        const wizardService = new WizardService(
            permissionService,
            ({ get: jest.fn(() => Promise.resolve()) } as unknown) as SubmissionService,
            (jest.fn() as unknown) as TeamService,
            mockFileService,
            (jest.fn() as unknown) as SemanticExtractionService,
            mockConfig,
        );

        await expect(
            wizardService.saveManuscriptFile(
                mockUser,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                (new Promise(resolve => resolve({ createReadStream: jest.fn() })) as unknown) as FileUpload,
                0,
                (jest.fn() as unknown) as PubSub,
            ),
        ).rejects.toThrow('Manuscript upload failed to store file.');
        expect(mockFileService.create).toBeCalled();
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
    it('sets file to cancelled and throws if the upload process fails', async (): Promise<void> => {
        const permissionService = ({
            userCanWithSubmission: jest.fn(() => true),
        } as unknown) as PermissionService;

        const mockFileService = ({
            create: jest.fn(),
            uploadManuscript: jest.fn(() => Promise.reject('test error')),
        } as unknown) as FileService;

        const wizardService = new WizardService(
            permissionService,
            ({ get: jest.fn(() => Promise.resolve()) } as unknown) as SubmissionService,
            (jest.fn() as unknown) as TeamService,
            mockFileService,
            (jest.fn() as unknown) as SemanticExtractionService,
            mockConfig,
        );

        await expect(
            wizardService.saveSupportingFile(
                mockUser,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                (new Promise(resolve => resolve({ createReadStream: jest.fn() })) as unknown) as FileUpload,
                0,
                (jest.fn() as unknown) as PubSub,
            ),
        ).rejects.toThrow('Supporting upload failed to store file.');
        expect(mockFileService.create).toBeCalled();
    });
    it('should return the file that has been added on upload', async (): Promise<void> => {
        const permissionService = ({
            userCanWithSubmission: jest.fn(() => true),
        } as unknown) as PermissionService;

        const mockUpdate = jest.fn();
        const submissionId = new SubmissionId();
        const fileId = new FileId();
        const testFile: File = new File({
            mimeType: '',
            size: 0,
            status: '',
            submissionId: submissionId,
            type: FileType.SUPPORTING_FILE,
            filename: 'bob',
            id: fileId,
        });
        const mockFileService = ({
            create: jest.fn(() => testFile),
            update: mockUpdate,
            uploadSupportingFile: jest.fn(() => Promise.resolve(testFile)),
        } as unknown) as FileService;

        const wizardService = new WizardService(
            permissionService,
            ({ get: jest.fn(() => Promise.resolve()) } as unknown) as SubmissionService,
            (jest.fn() as unknown) as TeamService,
            mockFileService,
            (jest.fn() as unknown) as SemanticExtractionService,
            mockConfig,
        );

        const supportingFile = await wizardService.saveSupportingFile(
            mockUser,
            SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
            (new Promise(resolve => resolve({ createReadStream: jest.fn() })) as unknown) as FileUpload,
            0,
            (jest.fn() as unknown) as PubSub,
        );
        expect(supportingFile.id).toBe(fileId);
    });
});

// TODO: write tests
describe('deleteSupportingFile', () => {});

// TODO: write tests
describe('saveFilesPage', () => {});

describe('saveDetailsPage', () => {
    const mockConfig = ({} as unknown) as Config;
    it('it should return an exception if submission is not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;
        const teamServiceMock = (jest.fn() as unknown) as TeamService;

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
            wizardService.getSubmission(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a')),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-10Dc77567',
            })),
        } as unknown) as SubmissionService;
        const teamServiceMock = (jest.fn() as unknown) as TeamService;

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
            id: '89e0aec8-b9fc-4413-8a37-5cc77567', // imposter
            name: 'Bob',
            role: 'user',
        };

        await expect(
            wizardService.getSubmission(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a')),
        ).rejects.toThrow('User not allowed to read submission');
    });
});
