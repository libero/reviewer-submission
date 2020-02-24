import { WizardService } from './service';
import { SubmissionService } from '../../domain/submission';
import { TeamService } from '../../domain/teams/services/team-service';
import { SubmissionId } from '../../domain/submission/types';
import { TeamId } from '../../domain/teams/types';

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

        const wizardService = new WizardService(submissionServiceMock, teamServiceMock);
        await expect(
            wizardService.saveDetailsPage(SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
                firstName: 'John',
                lastName: 'Smith',
                email: 'john.smith@example.com',
                aff: 'aff',
            }),
        ).rejects.toThrow();
    });

    it('should update when team exists', async () => {
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({})),
        } as unknown) as SubmissionService;
        const existingTeam = {
            id: TeamId.fromUuid('cda3aef6-0034-4620-b843-1d15b7e815d1'),
        };
        const teamServiceMock = ({
            find: jest.fn().mockImplementationOnce(() => existingTeam),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const wizardService = new WizardService(submissionServiceMock, teamServiceMock);
        await wizardService.saveDetailsPage(SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a'), {
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
        const submissionServiceMock = ({
            get: jest.fn().mockImplementationOnce(() => ({})),
        } as unknown) as SubmissionService;
        const existingTeam = null;
        const teamServiceMock = ({
            find: jest.fn().mockImplementationOnce(() => existingTeam),
            update: jest.fn(),
            create: jest.fn(),
        } as unknown) as TeamService;

        const wizardService = new WizardService(submissionServiceMock, teamServiceMock);
        const subId = SubmissionId.fromUuid('89e0aec8-b9fc-4413-8a37-5cc775edbe3a');
        await wizardService.saveDetailsPage(subId, {
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
});
