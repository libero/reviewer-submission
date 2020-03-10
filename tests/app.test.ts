import axios from 'axios';
import { sign } from 'jsonwebtoken';
import config from '../src/config';
import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, FetchResult } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import gql from 'graphql-tag';
import * as FormData from 'form-data';

const jwtToken = sign({ sub: 'c0e64a86-2feb-435d-a40f-01f920334bc4' }, config.authentication_jwt_secret);

const authLink = setContext((_, { headers }) => {
    return {
        headers: {
            ...headers,
            authorization: `Bearer ${jwtToken}`,
        },
    };
});

const createApolloClient = (): ApolloClient<unknown> => {
    return new ApolloClient<unknown>({
        link: ApolloLink.from([
            onError(({ graphQLErrors, networkError }) => {
                if (graphQLErrors)
                    graphQLErrors.forEach(({ message, locations, path }) =>
                        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`),
                    );
                if (networkError) console.log(`[Network error]: ${networkError}`);
            }),
            authLink.concat(
                new HttpLink({
                    uri: 'http://localhost:3000/graphql',
                    credentials: 'same-origin',
                }),
            ),
        ]),
        cache: new InMemoryCache(),
    });
};

const startSubmission = async (apollo: ApolloClient<unknown>, articleType: string): Promise<FetchResult> => {
    const startSubmission = gql`
        mutation StartSubmission($articleType: String!) {
            startSubmission(articleType: $articleType) {
                id
            }
        }
    `;

    return apollo.mutate({
        mutation: startSubmission,
        variables: {
            articleType,
        },
    });
};

describe('Application Integration Tests', () => {
    let apollo: ApolloClient<unknown>;

    beforeEach(() => {
        apollo = createApolloClient();
    });

    it('returns no errors on valid research article', async () => {
        const response = await startSubmission(apollo, 'researchArticle');
        const data = response.data ? response.data : null;

        expect(data).toBeTruthy();
        const id = data && data.startSubmission ? data.startSubmission.id : '';
        expect(id).toHaveLength(36);
    });

    it('returns error on invalid research article', async () => {
        expect.assertions(1);
        await expect(startSubmission(apollo, 'Bedtime story')).rejects.toThrow('GraphQL error: Invalid article type');
    });

    // This is left using axios - as we are simulating a bad-actor
    // otherwise this query is caught as invalid by the client.
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

    // see https://github.com/libero/reviewer-submission/issues/109
    it('uploads a manuscript file', async () => {
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

    it('deletes a manuscript file', async () => {
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

        const submissionId = loginResponse.data.data.startSubmission.id;
        const uploadQuery = `mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
            uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
                id,
                manuscriptFile {
                    id
                }
            }
        }`;

        const operations = {
            query: uploadQuery,
            variables: {
                id: submissionId,
                file: null,
                fileSize: 2,
            },
        };

        body.append('operations', JSON.stringify(operations));
        body.append('map', '{ "1": ["variables.file"] }');
        body.append('1', 'a', { filename: 'a.txt' });

        const uploadResponse = await axios.post('http://localhost:3000/graphql', body, {
            headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
        });

        expect(uploadResponse.status).toBe(200);

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation DeleteManuscript($fileId: ID!, $submissionId: ID!) {
                        deleteManuscript(fileId: $fileId, submissionId: $submissionId) 
                    }
                `,
                variables: {
                    fileId: uploadResponse.data.data.uploadManuscript.manuscriptFile.id,
                    submissionId,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data.errors).toBeUndefined();
    });

    it('it should throw a user tries to delete a file unrelated to their submission', async () => {
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

        const submissionId = loginResponse.data.data.startSubmission.id;
        const uploadQuery = `mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
            uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
                id,
                manuscriptFile {
                    id
                }
            }
        }`;

        const operations = {
            query: uploadQuery,
            variables: {
                id: submissionId,
                file: null,
                fileSize: 2,
            },
        };

        body.append('operations', JSON.stringify(operations));
        body.append('map', '{ "1": ["variables.file"] }');
        body.append('1', 'a', { filename: 'a.txt' });

        const uploadResponse = await axios.post('http://localhost:3000/graphql', body, {
            headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
        });

        expect(uploadResponse.status).toBe(200);

        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, config.authentication_jwt_secret);

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation DeleteManuscript($fileId: ID!, $submissionId: ID!) {
                        deleteManuscript(fileId: $fileId, submissionId: $submissionId) 
                    }
                `,
                variables: {
                    fileId: uploadResponse.data.data.uploadManuscript.manuscriptFile.id,
                    submissionId,
                },
            },
            {
                headers: { Authorization: `Bearer ${imposterToken}` },
            },
        );

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data.errors).toBeDefined();
        expect(deleteResponse.data.errors[0].message).toBe('User not allowed to delete files');
    });

    it('it should allow a user to delete their submission', async () => {
        const startSubmissionResponse = await axios.post(
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

        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation DeleteSubmission($id: ID!) {
                        deleteSubmission(id: $id) 
                    }
                `,
                variables: {
                    id: submissionId,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data.errors).toBeUndefined();
    });

    it('it should throw if the user tries to delete a submission that is not their own', async () => {
        const startSubmissionResponse = await axios.post(
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

        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, config.authentication_jwt_secret);

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation DeleteSubmission($id: ID!) {
                        deleteSubmission(id: $id) 
                    }
                `,
                variables: {
                    id: submissionId,
                },
            },
            {
                headers: { Authorization: `Bearer ${imposterToken}` },
            },
        );

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data.errors).toBeDefined();
        expect(deleteResponse.data.errors[0].message).toBe('User not allowed to delete submission');
    });
});
