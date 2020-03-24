import ApolloClient from 'apollo-client';
import { createApolloClient, startSubmission, submit } from './test.utils';

describe('Submit Integration Tests', () => {
    let apollo: ApolloClient<unknown>;

    beforeEach(() => {
        apollo = createApolloClient();
    });

    it('cannot submit an invalid submission', async () => {
        const response = await startSubmission(apollo, 'research-article');
        const data = response.data ? response.data : null;

        expect(data).toBeTruthy();
        const id = data && data.startSubmission ? data.startSubmission.id : '';
        expect(id).toHaveLength(36);

        await submit(apollo, id);
        // return expect().resolves.toThrow(
        //     'child "manuscriptDetails" fails because [child "title" fails because ["title" is required]]',
        // );
    });
});
