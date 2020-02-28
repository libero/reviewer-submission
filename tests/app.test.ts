import axios from 'axios';
import { sign } from 'jsonwebtoken';
import * as FormData from 'form-data';
import config from '../src/config';

const jwtToken = sign({ sub: '123' }, config.authentication_jwt_secret);

describe('Application Integration Tests', () => {
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

    it('returns error bad query - when depth is more than 5', async () => {
        await axios
            .post(
                'http://localhost:3000/graphql',
                {
                    query: `query QueryIsTooDeep {
                        getCurrentUser {
                            getCurrentUser {
                                getCurrentUser {
                                    getCurrentUser {
                                        getCurrentUser {
                                            getCurrentUser {
                                                id
                                                name
                                                role
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
                expect(e.response.data.errors[0].message).toBe("'QueryIsTooDeep' exceeds maximum operation depth of 5");
                expect(e.response.status).toBe(400);
            });
    });

    it.only('uploads a manuscript file', async () => {
        const body = new FormData();

        const loginResponse = await axios.post(
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

        console.log('loginResponse.data', loginResponse.data);

        const id = loginResponse.data.data.startSubmission.id;
        const query = `mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
            uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
                id
            }
        }`;

        const operations = {
            query,
            variables: {
                id,
                file: null,
                fileSize: 2,
            },
        };

        body.append('operations', JSON.stringify(operations));
        body.append('map', '{ "1": ["variables.file"] }');
        body.append('1', 'a', { filename: 'a.txt' });

        const response = await axios.post('http://localhost:3000/graphql', body, {
            headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
        });

        expect(response.status).toBe(200);
        expect(response.data.data.uploadManuscript.id).toBe(id);
    });
});
