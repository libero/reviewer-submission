// TODO: Tests for the controller class
import { SubmissionRepository, ISubmission} from './submission.repository';
import { SubmissionController } from './submission.controller';
import { Some, None } from 'funfix';
import { Submission } from './submission.entity';
import { v4 } from 'uuid';

describe('submission controller', () => {
  const mockISubmission: ISubmission = {
    id: v4(),
    title: 'The Importance of Unit Testing One\'s Controller Logic',
    updated: new Date(),
  };

  const newMockSubmissionRepository = () => ({
    findAll: jest.fn(async () => [mockISubmission, mockISubmission]),
    findById: jest.fn(async () => None),
    save: jest.fn(async (arg: ISubmission) => arg),
    delete: jest.fn(async () => false),
  });

  describe('find all submissions',  () => {
    it('finds all submissions', async () => {
      const mockRepo = newMockSubmissionRepository();

      const controller = new SubmissionController( mockRepo );

      const allFound = await controller.findAll();

      expect(mockRepo.findAll.mock.calls.length).toBe(1);
      expect(allFound.length).toBe(2);
      expect(allFound[0]).toBeInstanceOf(Submission);
      expect(allFound[1]).toBeInstanceOf(Submission);
    });

    it('errors when it doesn\'t have a repo', async () => {
      const mockRepo = newMockSubmissionRepository();

      const controller = new SubmissionController( mockRepo );
      controller.repository = None;

      expect(controller.findAll()).rejects.toThrow();
      expect(mockRepo.findAll.mock.calls.length).toBe(0);
    });

    it('returns an empty array when there aren\'t any submissions', async () => {
      const findAll = jest.fn(async () => []);

      const mockRepo = {
        ...newMockSubmissionRepository(),
        findAll,
      };

      const controller = new SubmissionController( mockRepo );

      const allFound = await controller.findAll();

      expect(mockRepo.findAll.mock.calls.length).toBe(1);
      expect(allFound.length).toBe(0);
    });
  });

  describe('start new submission', () => {
    it('starts a new submission', async () => {
      const mockRepo = newMockSubmissionRepository();

      const controller = new SubmissionController( mockRepo );

      const newSubmission = await controller.start();
      expect(mockRepo.save.mock.calls.length).toBe(1);
      expect(newSubmission).toBeInstanceOf(Submission);
    });

    it('errors when it doesn\'t have a repo', async () => {
      const mockRepo = newMockSubmissionRepository();

      const controller = new SubmissionController( mockRepo );
      controller.repository = None;

      expect(controller.start()).rejects.toThrow();
      expect(mockRepo.save.mock.calls.length).toBe(0);
    });
  });

  describe('findOne submission', () => {
    it('errors when it can\'t find one', async () => {
      const mockRepo = newMockSubmissionRepository();

      const controller = new SubmissionController( mockRepo );

      expect(controller.findOne(v4())).rejects.toThrow();
      expect(mockRepo.findById.mock.calls.length).toBe(1);
    });

    it('errors when it doesn\'t have a repo', async () => {
      const mockRepo = newMockSubmissionRepository();

      const controller = new SubmissionController( mockRepo );
      controller.repository = None;

      expect(controller.findOne(v4())).rejects.toThrow();
      expect(mockRepo.findById.mock.calls.length).toBe(0);
    });

    it('returns it if it\'s there', async () => {
      const findById = jest.fn(async () => Some(mockISubmission));

      const mockRepo = {
        ...newMockSubmissionRepository(),
        findById,
      };

      const controller = new SubmissionController( mockRepo );

      const found =  await controller.findOne(v4());

      expect(findById.mock.calls.length).toBe(1);
      expect(found).toBeInstanceOf(Submission);
    });
  });

  describe('changeTitle for a submission', () => {
    it('errors when it doesn\'t have a repo', async () => {
      const mockRepo = newMockSubmissionRepository();

      const controller = new SubmissionController( mockRepo );
      controller.repository = None;

      expect(controller.findOne(v4())).rejects.toThrow();
      expect(mockRepo.save.mock.calls.length).toBe(0);
      expect(mockRepo.findById.mock.calls.length).toBe(0);
    });

    it('errors when the submission doesn\'t exist', async () => {
      const findById = jest.fn(async () => None);

      const mockRepo = {
        ...newMockSubmissionRepository(),
        findById,
      };

      const controller = new SubmissionController( mockRepo );

      expect(controller.changeTitle(v4(), 'Some new title that will be lost in the sands of time')).rejects.toThrow();
      expect(findById.mock.calls.length).toBe(1);
      expect(mockRepo.save.mock.calls.length).toBe(0);
    });

    it('changes the title', async () => {
      const findById = jest.fn(async () => Some(mockISubmission));

      const mockRepo = {
        ...newMockSubmissionRepository(),
        findById,
      };

      const controller = new SubmissionController( mockRepo );

      const newTitle = 'Some new title';

      const newSubmission = await controller.changeTitle(v4(), newTitle);

      expect(newSubmission).toBeInstanceOf(Submission);
      expect(newSubmission.title).toBe(newTitle);
      expect(findById.mock.calls.length).toBe(1);
      expect(mockRepo.save.mock.calls.length).toBe(1);
    });
  });
});
