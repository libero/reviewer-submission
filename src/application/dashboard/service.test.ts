import { DashboardService } from './service';
import { SubmissionService } from '../../domain/submission';
import { SubmissionOperation } from '../permission/service';
import { SubmissionId } from '../../domain/submission/types';
import { ArticleType } from '../../domain/submission/services/models/submission';

describe('dashboard service', () => {
    const mockUser = {
        id: '9d9f43c7-95bd-4d7e-9022-9122d2a2a8be',
        name: 'Alice',
        role: 'user',
    };

    const mockSubmissionId = SubmissionId.fromUuid('7e892574-69c3-4d1c-bf09-c02fad99ea4c');
    const mockSubmission = {
        id: mockSubmissionId,
        createdBy: '89e0aec8-b9fc-4413-8a37-5cc77567',
        files: {},
        status: 'INITIAL',
    };
    const permissionService = {
        isStaff: jest.fn(),
        userCan: jest.fn(),
        userCanWithSubmission: jest.fn(),
    };

    let submissionService: SubmissionService;

    beforeEach(() => {
        jest.resetAllMocks();
        submissionService = ({
            create: jest.fn(async () => ({
                status: 'INITIAL',
            })),
            findByUserId: jest.fn(async () => []),
            get: jest.fn().mockImplementation(() => mockSubmission),
            saveArticleType: jest.fn(),
            delete: jest.fn(),
        } as unknown) as SubmissionService;
    });

    describe('findMySubmissions', () => {
        it('can find my submissions', async () => {
            const service = new DashboardService(permissionService, submissionService);
            await service.findMySubmissions(mockUser);
            expect(submissionService.findByUserId).toHaveBeenCalledTimes(1);
        });

        it('finding my submissions is not permission checked', async () => {
            const service = new DashboardService(permissionService, submissionService);
            await service.findMySubmissions(mockUser);
            expect(permissionService.isStaff).toHaveBeenCalledTimes(0);
            expect(permissionService.userCan).toHaveBeenCalledTimes(0);
            expect(permissionService.userCanWithSubmission).toHaveBeenCalledTimes(0);
        });

        it('should map the status correctly', async () => {
            submissionService = ({
                findByUserId: jest.fn(async () => [
                    { status: 'INITIAL', updated: new Date().toISOString() },
                    { status: 'MECA_IMPORT_FAILED', updated: new Date().toISOString() },
                    { status: 'MECA_EXPORT_FAILED', updated: new Date().toISOString() },
                    { status: 'MECA_EXPORT_SUCCEEDED', updated: new Date().toISOString() },
                    { status: 'MECA_EXPORT_PENDING', updated: new Date().toISOString() },
                    { status: 'not a status', updated: new Date().toISOString() },
                ]),
            } as unknown) as SubmissionService;
            const service = new DashboardService(permissionService, submissionService);
            const subs = await service.findMySubmissions(mockUser);
            const subStatuses = subs.map(sub => sub.status);
            expect(permissionService.isStaff).toHaveBeenCalledTimes(0);
            expect(permissionService.userCan).toHaveBeenCalledTimes(0);
            expect(permissionService.userCanWithSubmission).toHaveBeenCalledTimes(0);
            expect(subStatuses).toStrictEqual([
                'CONTINUE_SUBMISSION',
                'SUBMITTED',
                'SUBMITTED',
                'SUBMITTED',
                'SUBMITTED',
                'CONTINUE_SUBMISSION',
            ]);
        });
    });

    describe('startSubmission', () => {
        it('calls create when allowed', async () => {
            permissionService.userCan = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.startSubmission(mockUser, 'article-type');
            expect(submissionService.create).toHaveBeenCalledTimes(1);
            expect(submissionService.create as jest.Mock).toHaveBeenCalledWith('article-type', mockUser.id);
        });
        it('checks permissions', async () => {
            permissionService.userCan = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.startSubmission(mockUser, 'article-type');
            expect(permissionService.userCan).toHaveBeenCalledTimes(1);
            expect(permissionService.userCan as jest.Mock).toHaveBeenCalledWith(mockUser, SubmissionOperation.CREATE);
        });
        it("doesn't call create when not allowed, and throws", async () => {
            permissionService.userCan = jest.fn().mockReturnValue(false);
            const service = new DashboardService(permissionService, submissionService);
            expect(service.startSubmission(mockUser, 'article-type')).rejects.toThrow(
                'User not allowed to create submission',
            );
            expect(submissionService.create).toHaveBeenCalledTimes(0);
        });
    });

    describe('getSubmission', () => {
        it('calls get when allowed', async () => {
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.getSubmission(mockUser, mockSubmissionId);
            expect(submissionService.get).toHaveBeenCalledTimes(1);
            expect(submissionService.get as jest.Mock).toHaveBeenCalledWith(mockSubmissionId);
        });
        it('checks permissions', async () => {
            submissionService.get = jest.fn().mockReturnValue('cheese');
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.getSubmission(mockUser, mockSubmissionId);
            expect(permissionService.userCanWithSubmission).toHaveBeenCalledTimes(1);
            expect(permissionService.userCanWithSubmission as jest.Mock).toHaveBeenCalledWith(
                mockUser,
                SubmissionOperation.READ,
                'cheese',
            );
        });
        it('throws when not allowed', async () => {
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(false);
            const service = new DashboardService(permissionService, submissionService);
            expect(service.getSubmission(mockUser, mockSubmissionId)).rejects.toThrow(
                'User not allowed to read submission',
            );
        });
    });

    describe('deleteSubmission', () => {
        it('calls delete when allowed', async () => {
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.deleteSubmission(mockUser, mockSubmissionId);
            expect(submissionService.delete).toHaveBeenCalledTimes(1);
            expect(submissionService.delete as jest.Mock).toHaveBeenCalledWith(mockUser, mockSubmissionId);
        });
        it('checks permissions', async () => {
            submissionService.get = jest.fn().mockReturnValue('cheese');
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.deleteSubmission(mockUser, mockSubmissionId);
            expect(permissionService.userCanWithSubmission).toHaveBeenCalledTimes(1);
            expect(permissionService.userCanWithSubmission as jest.Mock).toHaveBeenCalledWith(
                mockUser,
                SubmissionOperation.DELETE,
                'cheese',
            );
        });
        it('throws when not allowed and does not call delete', async () => {
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(false);
            const service = new DashboardService(permissionService, submissionService);
            expect(service.deleteSubmission(mockUser, mockSubmissionId)).rejects.toThrow(
                'User not allowed to delete submission',
            );
            expect(submissionService.delete).toHaveBeenCalledTimes(0);
        });
    });

    describe('saveArticleType', () => {
        it('calls update when allowed', async () => {
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.saveArticleType(mockUser, mockSubmissionId, ArticleType.RESEARCH_ARTICLE);
            expect(submissionService.saveArticleType).toHaveBeenCalledTimes(1);
            expect(submissionService.saveArticleType as jest.Mock).toHaveBeenCalledWith(
                mockSubmission,
                ArticleType.RESEARCH_ARTICLE,
            );
        });
        it('checks permissions', async () => {
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(true);
            const service = new DashboardService(permissionService, submissionService);
            await service.saveArticleType(mockUser, mockSubmissionId, ArticleType.RESEARCH_ARTICLE);
            expect(permissionService.userCanWithSubmission).toHaveBeenCalledTimes(1);
            expect(permissionService.userCanWithSubmission as jest.Mock).toHaveBeenCalledWith(
                mockUser,
                SubmissionOperation.UPDATE,
                mockSubmission,
            );
        });
        it("doesn't call create when not allowed, and throws", async () => {
            permissionService.userCanWithSubmission = jest.fn().mockReturnValue(false);
            const service = new DashboardService(permissionService, submissionService);
            expect(service.saveArticleType(mockUser, mockSubmissionId, ArticleType.RESEARCH_ARTICLE)).rejects.toThrow(
                'User not allowed to submit',
            );
            expect(submissionService.saveArticleType).toHaveBeenCalledTimes(0);
        });
    });
});
