import { mocked } from 'ts-jest/utils';
import fetch, { Response } from 'node-fetch';
import { RestUserRepository } from './rest-user';

jest.mock('node-fetch');
const mockedFetch = mocked(fetch, true);

describe('User Repository', () => {
    beforeEach(() => {
        mockedFetch.mockReset();
    });

    it('can get current user', async () => {
        const mockFetchPromise = {
            json: () => Promise.resolve({ value: 3 }),
        } as unknown;

        mockedFetch.mockResolvedValue(Promise.resolve(mockFetchPromise as Response));

        const repo = new RestUserRepository('user-url');
        const user = await repo.getCurrentUser('header');
        expect(user).toMatchObject({ value: 3 });
        expect(mockedFetch).toHaveBeenCalled();
        expect(mockedFetch).toHaveBeenCalledWith('user-url/current-user', {
            headers: [['authorization', 'header']],
        });
    });

    it('can get editors with role', async () => {
        const mockFetchPromise = {
            json: () => Promise.resolve({ value: 42 }),
        } as unknown;

        mockedFetch.mockResolvedValue(Promise.resolve(mockFetchPromise as Response));

        const repo = new RestUserRepository('user-url');
        const user = await repo.getEditors('header', 'ham&egg');
        expect(user).toMatchObject({ value: 42 });
        expect(mockedFetch).toHaveBeenCalled();
        expect(mockedFetch).toHaveBeenCalledWith('user-url/editors?role=ham&egg', {
            headers: [['authorization', 'header']],
        });
    });
});
