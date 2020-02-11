import { mocked } from 'ts-jest/utils';
import fetch, { Response } from 'node-fetch';
import { RestUserRepository } from './rest-user';

jest.mock('node-fetch');
const mockedFetch = mocked(fetch, true);

describe('REST User Repository', () => {
    it('get current user', async () => {
        const mockFetchPromise = Promise.resolve({
            json: () => Promise.resolve({ value: 3 }),
        }) as unknown;

        mockedFetch.mockResolvedValue(Promise.resolve(mockFetchPromise as Response));

        const repo = new RestUserRepository('user-url');
        const user = await repo.getCurrentUser('header');
        expect(user).toMatchObject({ value: 3 });
        expect(mockedFetch).toHaveBeenCalled();
        expect(mockedFetch).toHaveBeenCalledWith('user-url', {
            headers: [['authorization', 'header']]
        });
    });
});
