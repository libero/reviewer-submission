import axios from 'axios';
import { sign } from 'jsonwebtoken';
import config from '../src/config';

const jwtToken = sign({ sub: '123' }, config.authentication_jwt_secret);

describe('App', () => {
    it('returns no errors on valid research article', async () => {
        const response = await axios.post(
            'http://localhost:3000/graphql',
            {
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
            },
            { headers: { Authorization: `Bearer ${jwtToken}` } },
        );
        expect(response.status).toBe(200);
        console.log(response.data);
        expect(response.data.data.startSubmission.id).toHaveLength(36);
    });

    it('returns error on invalid research article', async () => {
        const response = await axios.post(
            'http://localhost:3000/graphql',
            {
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
            },
            { headers: { Authorization: `Bearer ${jwtToken}` } },
        );
        expect(response.status).toBe(200);
        expect(response.data.errors.length).toBeGreaterThan(0);
    });
});
