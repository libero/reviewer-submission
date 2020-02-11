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
        console.log(response.data.errors);
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
        expect(response.data.errors[0].message).toBe('Invalid article type');
    });

    it('returns error bad query - no articleType param', async () => {
        expect.assertions(2);
        await axios
            .post(
                'http://localhost:3000/graphql',
                {
                    query: `mutation StartSubmission($articleType: String) {
                    startSubmission(articleType: $articleType) {
                        id
                    }
                }
            `,
                    variables: {},
                },
                { headers: { Authorization: `Bearer ${jwtToken}` } },
            )
            .catch(e => {
                expect(e.response.status).toBe(400);
                expect(e.response.statusText).toBe('Bad Request');
            });
    });

    it.only('returns error bad query - when depth is more than 5', async () => {
        await axios
            .post(
                'http://localhost:3000/graphql',
                {
                    query: `query naughtyQuery {
                        getSubmission(id: "42") {
                            getSubmission(id: "42") {
                                getSubmission(id: "42") {
                                    getSubmission(id: "42") {
                                        getSubmission(id: "42") {
                                            getSubmission(id: "42") {
                                                id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                      }
            `,
                    variables: {},
                },
                { headers: { Authorization: `Bearer ${jwtToken}` } },
            )
            .catch(e => {
                console.log('e.response', e.response.data.errors);
                expect(e.response.data.errors[0].message).toBe("'naughtyQuery' exceeds maximum operation depth of 5")
                expect(e.response.status).toBe(400);
            });
    });
});
