import axios from 'axios';

describe('App', () => {
    it('returns no errors on valid research article', async () => {
        const response = await axios.post('http://localhost:3000/graphql', {
            query: `
                mutation StartSubmission($articleType: String!) {
                    startSubmission(articleType: $articleType) {
                        id
                    }
                }
            `,
            variables: {
                articleType: 'researchArticle',
            },
        });
        expect(response.status).toBe(200);
        expect(response.data.data.startSubmission.id).toHaveLength(36);
    });

    it('returns error on invalid research article', async () => {
        const response = await axios.post('http://localhost:3000/graphql', {
            query: `
                mutation StartSubmission($articleType: String!) {
                    startSubmission(articleType: $articleType) {
                        id
                    }
                }
            `,
            variables: {
                articleType: 'Invalid Article Type',
            },
        });
        expect(response.status).toBe(200);
        expect(response.data.errors.length).toBeGreaterThan(0);
    });
});
