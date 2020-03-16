import ApolloClient from 'apollo-client';
import { createApolloClient, startSubmission, submit } from './test.utils';

describe('Submit Integration Tests', () => {
    let apollo: ApolloClient<unknown>;

    beforeEach(() => {
        apollo = createApolloClient();
    });

    it('submits a valid submission', async () => {
        const response = await startSubmission(apollo, 'researchArticle');
        const data = response.data ? response.data : null;

        expect(data).toBeTruthy();
        const id = data && data.startSubmission ? data.startSubmission.id : '';
        expect(id).toHaveLength(36);

        const submitData = await submit(apollo, id);
        const submitId = submitData && submitData.data ? submitData.data.id : '';
        expect(id).toHaveLength(submitId);
    });
});
