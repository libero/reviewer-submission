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

const user = {
    id: '89e0aec8-b9fc-4413-8a37-5cc77567',
    name: 'Bob',
    role: 'user',
};

describe('getSubmission', () => {
    const mockConfig = ({} as unknown) as Config;
    const teamServiceMock = ({ findTeams: jest.fn().mockImplementation(() => []) } as unknown) as TeamService;

    const permissionService = new PermissionService();

    const fileServiceMock = ({
        findManuscriptFile: jest.fn().mockImplementation(() => null),
        getSupportingFiles: jest.fn().mockImplementation(() => []),
    } as unknown) as FileService;

    const semanticExtractionServiceMock = ({
        getSuggestion: jest.fn().mockImplementation(() => null),
    } as unknown) as SemanticExtractionService;

    const submissionServiceMock = ({
        get: jest.fn().mockImplementation(() => ({
            id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
            createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
            files: {},
            status: 'INITIAL',
        })),
    } as unknown) as SubmissionService;

    const emptySubmissionServiceMock = ({
        get: jest.fn().mockImplementationOnce(() => null),
    } as unknown) as SubmissionService;

    it('it should return an exception if submission is not found', async () => {
        const wizardService = new WizardService(
            permissionService,
            emptySubmissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );

        await expect(
            wizardService.getSubmission(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a')),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );
        const newUser = { ...user, id: '89e0aec8-b9fc-4413-8a37-5bc77567' };
        await expect(
            wizardService.getSubmission(newUser, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a')),
        ).rejects.toThrow('User not allowed to read submission');
    });

    it('it should return the full submission', async () => {
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
    const existingTeam = {
        id: TeamId.fromUuid('cda3aef6-0034-4620-b843-1d15b7e815d1'),
    };
    const teamServiceMock = ({
        find: jest.fn().mockImplementationOnce(() => existingTeam),
        updateOrCreateAuthor: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findTeams: jest.fn().mockImplementation(() => []),
    } as unknown) as TeamService;
    const permissionService = new PermissionService();
    const suggestion: Suggestion = { fieldName: 'title', value: 'title' };
    const semanticExtractionServiceMock = ({
        getSuggestion: jest.fn().mockReturnValue([suggestion]),
    } as unknown) as SemanticExtractionService;

    const fileServiceMock = ({
        findManuscriptFile: jest.fn(),
        getSupportingFiles: jest.fn().mockReturnValue([]),
    } as unknown) as FileService;

    const emptySubmissionServiceMock = ({
        get: jest.fn().mockImplementationOnce(() => null),
    } as unknown) as SubmissionService;

    const submissionServiceMock = ({
        saveAuthorDetails: jest.fn(),
        get: jest.fn().mockImplementation(() => ({
            createdBy: user.id,
            files: {},
            status: 'INITIAL',
        })),
    } as unknown) as SubmissionService;

    it('should throw if submission not found', async () => {
        const wizardService = new WizardService(
            permissionService,
            emptySubmissionServiceMock,
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
                institution: 'aff',
            }),
        ).rejects.toThrow('No submission found');
    });

    it('should throw if submission ownership is invalid', async () => {
        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );
        const newUser = { ...user, id: '89e0aec8-b9fc-4413-8a37-5zc77567' };
        await expect(
            wizardService.saveAuthorPage(newUser, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                institution: 'aff',
            }),
        ).rejects.toThrow('User not allowed to save submission');
    });

    it('should update when team exists', async () => {
        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );
        await wizardService.saveAuthorPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            institution: 'aff',
        });

        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledWith('89e0aec8-b9fc-4413-8a37-5cc775edbe3a', {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            institution: 'aff',
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
                status: 'INITIAL',
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

        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );

        await wizardService.saveAuthorPage(user, subId, {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            institution: 'aff',
        });

        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledTimes(1);
        expect(teamServiceMock.updateOrCreateAuthor).toHaveBeenCalledWith(subId.toString(), {
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            institution: 'aff',
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
                status: 'INITIAL',
            })),
        } as unknown) as SubmissionService;

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
                institution: 'aff',
            }),
        ).rejects.toThrow('User not allowed to save submission');
    });
});

describe('saveEditorPage', () => {
    const mockConfig = ({} as unknown) as Config;
    const teamServiceMock = ({
        addOrUpdateEditorTeams: jest.fn().mockImplementation(() => true),
        findTeams: jest.fn().mockImplementation(() => []),
    } as unknown) as TeamService;
    const permissionService = new PermissionService();
    const fileServiceMock = ({
        findManuscriptFile: jest.fn().mockImplementation(),
        getSupportingFiles: jest.fn().mockImplementation(() => []),
    } as unknown) as FileService;
    const semanticExtractionServiceMock = ({
        getSuggestion: jest.fn().mockImplementation(() => ''),
    } as unknown) as SemanticExtractionService;

    it('it should return an exception if submission is not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;
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

        const details = {
            suggestedSeniorEditors: ['abc'],
            opposedSeniorEditors: ['def'],
            opposedSeniorEditorsReason: 'reason',
            suggestedReviewingEditors: ['ghi'],
            opposedReviewingEditors: ['jkl'],
            opposedReviewingEditorsReason: 'reason 2',
            suggestedReviewers: [{ name: 'bill', email: 'bill@bill.com' }],
            opposedReviewers: [{ name: 'jane', email: 'jane@jane.com' }],
            opposedReviewersReason: 'reason',
        };

        await expect(
            wizardService.saveEditorPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), details),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-10Dc77567',
                status: 'INITIAL',
            })),
        } as unknown) as SubmissionService;

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

        const details = {
            suggestedSeniorEditors: ['abc'],
            opposedSeniorEditors: ['def'],
            opposedSeniorEditorsReason: 'reason',
            suggestedReviewingEditors: ['ghi'],
            opposedReviewingEditors: ['jkl'],
            opposedReviewingEditorsReason: 'reason 2',
            suggestedReviewers: [{ name: 'bill', email: 'bill@bill.com' }],
            opposedReviewers: [{ name: 'jane', email: 'jane@jane.com' }],
            opposedReviewersReason: 'reason',
        };

        await expect(
            wizardService.saveEditorPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), details),
        ).rejects.toThrow('User not allowed to save submission');
    });

    it('should pass editor details to required services', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementation(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
                files: {},
                status: 'INITIAL',
            })),
            saveEditorDetails: jest.fn().mockImplementation(),
        } as unknown) as SubmissionService;
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

        const details = {
            suggestedSeniorEditors: ['abc'],
            opposedSeniorEditors: ['def'],
            opposedSeniorEditorsReason: 'reason',
            suggestedReviewingEditors: ['ghi'],
            opposedReviewingEditors: ['jkl'],
            opposedReviewingEditorsReason: 'reason 2',
            suggestedReviewers: [{ name: 'bill', email: 'bill@bill.com' }],
            opposedReviewers: [{ name: 'jane', email: 'jane@jane.com' }],
            opposedReviewersReason: 'reason',
        };

        const submission = await wizardService.saveEditorPage(
            user,
            SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
            details,
        );

        expect(teamServiceMock.addOrUpdateEditorTeams).toBeCalledWith('89e0aec8-b9fc-4413-8a37-5cc775edbe3a', details);
        expect(submissionServiceMock.saveEditorDetails).toBeCalledWith(
            {
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
                files: {},
                status: 'INITIAL',
            },
            details.opposedReviewersReason,
            details.opposedReviewingEditorsReason,
            details.opposedSeniorEditorsReason,
        );
        expect(submission).toBeDefined();
        expect(submission?.createdBy).toBe('89e0aec8-b9fc-4413-8a37-5cc77567');
    });
});

describe('saveDisclosurePage', () => {
    const mockConfig = ({} as unknown) as Config;

    const teamServiceMock = ({
        addOrUpdateEditorTeams: jest.fn().mockImplementation(),
        findTeams: jest.fn().mockImplementation(() => []),
    } as unknown) as TeamService;

    const permissionService = new PermissionService();

    const fileServiceMock = ({
        findManuscriptFile: jest.fn().mockImplementation(() => null),
        getSupportingFiles: jest.fn().mockImplementation(() => []),
    } as unknown) as FileService;

    const semanticExtractionServiceMock = ({
        getSuggestion: jest.fn().mockImplementation(() => null),
    } as unknown) as SemanticExtractionService;

    it('it should throw if not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementation(() => null),
            saveDisclosureDetails: jest.fn().mockImplementation(),
        } as unknown) as SubmissionService;

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
        const details = {
            submitterSignature: 'signature',
            disclosureConsent: false,
        };
        await expect(
            wizardService.saveDisclosurePage(
                user,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                details,
            ),
        ).rejects.toThrow('No submission found');
    });

    it('it should throw if not the owner', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementation(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-65c77567',
                files: {},
            })),
            saveDisclosureDetails: jest.fn().mockImplementation(),
        } as unknown) as SubmissionService;

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
        const details = {
            submitterSignature: 'signature',
            disclosureConsent: false,
        };
        await expect(
            wizardService.saveDisclosurePage(
                user,
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                details,
            ),
        ).rejects.toThrow('User not allowed to submit');
    });

    it('should call the required service', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementation(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
                files: {},
                status: 'INITIAL',
            })),
            saveDisclosureDetails: jest.fn().mockImplementation(),
        } as unknown) as SubmissionService;

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
        const details = {
            submitterSignature: 'signature',
            disclosureConsent: false,
        };
        const submission = await wizardService.saveDisclosurePage(
            user,
            SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
            details,
        );

        expect(submissionServiceMock.saveDisclosureDetails).toBeCalledWith(
            {
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
                files: {},
                status: 'INITIAL',
            },
            details,
        );
        expect(submission).toBeDefined();
        expect(submission?.createdBy).toBe('89e0aec8-b9fc-4413-8a37-5cc77567');
    });
});

describe('submit', () => {
    const mockConfig = ({} as unknown) as Config;
    const sub = {
        id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
        createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
        files: {},
        status: 'INITIAL',
    };
    const user = {
        id: '89e0aec8-b9fc-4413-8a37-5cc77567',
        name: 'Bob',
        role: 'user',
    };
    const ip = '192.168.168.168';
    const permissionService = new PermissionService();

    const fileServiceMock = ({
        findManuscriptFile: jest.fn().mockImplementation(() => null),
        getSupportingFiles: jest.fn().mockImplementation(() => []),
    } as unknown) as FileService;

    const semanticExtractionServiceMock = ({
        getSuggestion: jest.fn().mockImplementation(() => null),
    } as unknown) as SemanticExtractionService;

    const teamServiceMock = ({ findTeams: jest.fn().mockImplementation(() => []) } as unknown) as TeamService;

    it('it should return an exception if submission is not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;

        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );

        await expect(
            wizardService.submit(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), ip),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if not owner', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => sub),
        } as unknown) as SubmissionService;

        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );

        const newUser = { ...user, id: '89aec8-b9fc-4413-8a37-5cc77567' };
        await expect(
            wizardService.submit(newUser, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), ip),
        ).rejects.toThrow('User not allowed to submit');
    });

    it('it should return an call the service with required params', async () => {
        const submitMock = jest.fn().mockImplementationOnce(() => null);
        const submissionServiceMock = ({
            get: jest.fn().mockImplementation(() => sub),
            submit: submitMock,
        } as unknown) as SubmissionService;

        const wizardService = new WizardService(
            permissionService,
            submissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );

        const submission = await wizardService.submit(
            user,
            SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
            ip,
        );
        expect(submitMock.mock.calls[0][0]).toEqual({
            createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
            editorDetails: {},
            files: {
                manuscriptFile: null,
                supportingFiles: [],
            },
            id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
            status: 'CONTINUE_SUBMISSION',
        });
        expect(submitMock.mock.calls[0][1]).toEqual(ip);
        expect(submission).toBeDefined();
        expect(submission?.createdBy).toBe('89e0aec8-b9fc-4413-8a37-5cc77567');
    });
});

describe('deleteManuscriptFile', () => {
    const mockConfig = ({} as unknown) as Config;
    const teamServiceMock = (jest.fn() as unknown) as TeamService;
    const permissionService = new PermissionService();
    const fileServiceMock = ({
        deleteManuscript: jest.fn().mockImplementationOnce(() => true),
    } as unknown) as FileService;
    const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;

    it('it should return an exception if submission is not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;

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
            wizardService.deleteSupportingFile(
                FileId.fromUuid('4e9d8262-8e4f-45b5-8edc-b8aba02cef8b'),
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                user,
            ),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-10Dc77567',
            })),
        } as unknown) as SubmissionService;
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
            wizardService.deleteSupportingFile(
                FileId.fromUuid('4e9d8262-8e4f-45b5-8edc-b8aba02cef8b'),
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                user,
            ),
        ).rejects.toThrow('User not allowed to delete files');
    });

    it('should delete and return true', async () => {
        const submissionId = '26f61697-c936-4ceb-a90c-52d51e9f5468';
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                id: submissionId,
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
                status: 'INITIAL',
            })),
        } as unknown) as SubmissionService;

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
        const fileId = '4e9d8262-8e4f-45b5-8edc-b8aba02cef8b';

        const response = await wizardService.deleteManuscriptFile(
            FileId.fromUuid(fileId),
            SubmissionId.fromUuid(submissionId),
            user,
        );
        expect(response).toBe(true);
        expect(fileServiceMock.deleteManuscript).toBeCalledWith(
            user,
            FileId.fromUuid(fileId),
            SubmissionId.fromUuid(submissionId),
        );
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

describe('deleteSupportingFile', () => {
    const mockConfig = ({} as unknown) as Config;
    const teamServiceMock = (jest.fn() as unknown) as TeamService;
    const permissionService = new PermissionService();
    const fileServiceMock = (jest.fn() as unknown) as FileService;
    const semanticExtractionServiceMock = (jest.fn() as unknown) as SemanticExtractionService;
    const submissionServiceMock = ({
        get: jest.fn().mockImplementationOnce(() => ({
            id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
            createdBy: '89e0aec8-b9fc-4413-8a37-10Dc77567',
        })),
    } as unknown) as SubmissionService;

    it('it should return an exception if submission is not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;

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
            wizardService.deleteSupportingFile(
                FileId.fromUuid('4e9d8262-8e4f-45b5-8edc-b8aba02cef8b'),
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                user,
            ),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
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
            wizardService.deleteSupportingFile(
                FileId.fromUuid('4e9d8262-8e4f-45b5-8edc-b8aba02cef8b'),
                SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
                user,
            ),
        ).rejects.toThrow('User not allowed to delete files');
    });

    it('should delete and return fileId', async () => {
        const submissionId = '26f61697-c936-4ceb-a90c-52d51e9f5468';
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                id: submissionId,
                createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
                status: 'INITIAL',
            })),
        } as unknown) as SubmissionService;

        const fileServiceMock = ({
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            deleteSupportingFile: jest.fn().mockImplementationOnce((_, fileId, __) => fileId),
        } as unknown) as FileService;

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
        const fileId = '4e9d8262-8e4f-45b5-8edc-b8aba02cef8b';

        const returnedFileId = await wizardService.deleteSupportingFile(
            FileId.fromUuid(fileId),
            SubmissionId.fromUuid(submissionId),
            user,
        );
        expect(returnedFileId).toBe(fileId);
        expect(fileServiceMock.deleteSupportingFile).toBeCalledWith(
            user,
            FileId.fromUuid(fileId),
            SubmissionId.fromUuid(submissionId),
        );
    });
});

describe('saveFilesPage', () => {
    const mockConfig = ({} as unknown) as Config;
    const teamServiceMock = ({ findTeams: jest.fn().mockImplementation(() => []) } as unknown) as TeamService;
    const permissionService = new PermissionService();
    const fileServiceMock = ({
        findManuscriptFile: jest.fn().mockImplementation(() => null),
        getSupportingFiles: jest.fn().mockImplementation(() => []),
    } as unknown) as FileService;
    const semanticExtractionServiceMock = ({
        getSuggestion: jest.fn().mockImplementation(() => null),
    } as unknown) as SemanticExtractionService;

    it('it should return an exception if submission is not found', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => null),
        } as unknown) as SubmissionService;
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
            wizardService.saveFilesPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), 'cover'),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({
                id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
                createdBy: '89e0aec8-b9fc-4413-8a37-10Dc77567',
                file: [],
            })),
        } as unknown) as SubmissionService;

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
            wizardService.saveFilesPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), 'cover'),
        ).rejects.toThrow('User not allowed to update submission');
    });

    it('it should called savefilesDetails with cover', async () => {
        const sub = {
            id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
            createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
            files: {},
            status: 'INITIAL',
        };
        const submissionServiceMock = ({
            get: jest.fn().mockImplementation(() => sub),
            saveFilesDetails: jest.fn().mockImplementationOnce(() => true),
        } as unknown) as SubmissionService;

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

        const submission = await wizardService.saveFilesPage(
            user,
            SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
            'cover',
        );
        expect(submission.id).toBe('89e0aec8-b9fc-4413-8a37-5cc775edbe3a');
        expect(submissionServiceMock.saveFilesDetails).toBeCalledWith(sub, 'cover');
    });
});

describe('saveDetailsPage', () => {
    const mockConfig = ({} as unknown) as Config;
    const emptySubmissionServiceMock = ({
        get: jest.fn().mockImplementationOnce(() => null),
    } as unknown) as SubmissionService;
    const submissionServiceMock = ({
        get: jest.fn().mockImplementation(() => ({
            id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
            createdBy: '89e0aec8-b9fc-4413-8a37-10Dc77567',
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

    const user = {
        id: '89e0aec8-b9fc-4413-8a37-5cc77567',
        name: 'Bob',
        role: 'user',
    };
    it('it should return an exception if submission is not found', async () => {
        const wizardService = new WizardService(
            permissionService,
            emptySubmissionServiceMock,
            teamServiceMock,
            fileServiceMock,
            semanticExtractionServiceMock,
            mockConfig,
        );
        await expect(
            wizardService.saveDetailsPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
                title: 'title',
                subjects: ['subjects'],
                previouslyDiscussed: 'previouslyDiscussed',
                previouslySubmitted: 'previouslySubmitted',
                cosubmission: ['cosubmission'],
            }),
        ).rejects.toThrow('No submission found');
    });

    it('it should return an exception if user is not owner', async () => {
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
            wizardService.saveDetailsPage(user, SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
                title: 'title',
                subjects: ['subjects'],
                previouslyDiscussed: 'previouslyDiscussed',
                previouslySubmitted: 'previouslySubmitted',
                cosubmission: ['cosubmission'],
            }),
        ).rejects.toThrow('User not allowed to update submission');
    });

    it('should update the submission object with details', async () => {
        const sub = {
            id: '89e0aec8-b9fc-4413-8a37-5cc775edbe3a',
            createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
            files: {},
            status: 'INITIAL',
        };

        const details = {
            title: 'title',
            subjects: ['subjects'],
            previouslyDiscussed: 'previouslyDiscussed',
            previouslySubmitted: 'previouslySubmitted',
            cosubmission: ['cosubmission'],
        };

        const submissionServiceMock = ({
            get: jest
                .fn()
                .mockImplementationOnce(() => sub)
                .mockImplementationOnce(() => ({ ...sub, ...{ manuscriptDetails: { ...details } } })),
            saveManuscriptDetails: jest.fn().mockImplementation(),
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

        const submission = await wizardService.saveDetailsPage(
            user,
            SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'),
            details,
        );
        expect(submissionServiceMock.saveManuscriptDetails).toHaveBeenCalledWith(sub, details);
        expect(submission).toBeDefined();
        expect(submission.manuscriptDetails.title).toBe(details.title);
        expect(submission.manuscriptDetails.cosubmission).toBe(details.cosubmission);
        expect(submission.manuscriptDetails.previouslyDiscussed).toBe(details.previouslyDiscussed);
        expect(submission.manuscriptDetails.previouslySubmitted).toBe(details.previouslySubmitted);
        expect(submission.manuscriptDetails.subjects).toBe(details.subjects);
        expect(submission?.createdBy).toBe('89e0aec8-b9fc-4413-8a37-5cc77567');
    });
});
