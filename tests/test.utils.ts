import ApolloClient from 'apollo-client';
import axios, { AxiosResponse } from 'axios';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, FetchResult } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import gql from 'graphql-tag';
import { sign } from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';

export const authenticationJwtSecret = 'super_secret_jam';

export const jwtToken = sign({ sub: 'c0e64a86-2feb-435d-a40f-01f920334bc4' }, authenticationJwtSecret);

const authLink = setContext((_, { headers }) => {
    return {
        headers: {
            ...headers,
            authorization: `Bearer ${jwtToken}`,
        },
    };
});

export const createApolloClient = (): ApolloClient<unknown> => {
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

export const uploadManuscript = async (submissionId: string): Promise<AxiosResponse> => {
    const body = new FormData();
    const query = `mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
        uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
            id,
            files {
                manuscriptFile {
                    id
                    status
                }
            },
            suggestions {
                value
                fieldName
            }
        }
    }`;

    const operations = {
        query: query,
        variables: {
            id: submissionId,
            file: null,
            fileSize: 122,
        },
    };

    body.append('operations', JSON.stringify(operations));
    body.append('map', '{ "1": ["variables.file"] }');
    body.append(
        '1',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
        { filename: 'a.txt' },
    );

    return await axios.post('http://localhost:3000/graphql', body, {
        headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
    });
};

export const uploadLargeManuscript = async (submissionId: string): Promise<AxiosResponse> => {
    const body = new FormData();
    const query = `mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
        uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
            id,
            files {
                manuscriptFile {
                    id
                }
            },
            suggestions {
                value
                fieldName
            }
        }
    }`;

    const operations = {
        query: query,
        variables: {
            id: submissionId,
            file: null,
            fileSize: 761903,
        },
    };

    body.append('operations', JSON.stringify(operations));
    body.append('map', '{ "1": ["variables.file"] }');
    body.append('1', fs.createReadStream(path.join(__dirname, './mock-data/allowed.txt')), { filename: 'allowed.txt' });

    return await axios.post('http://localhost:3000/graphql', body, {
        headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
    });
};

export const uploadTooLargeManuscript = async (submissionId: string): Promise<AxiosResponse> => {
    const body = new FormData();
    const query = `mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
        uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
            id,
            files {
                manuscriptFile {
                    id
                }
            },
            suggestions {
                value
                fieldName
            }
        }
    }`;

    const operations = {
        query: query,
        variables: {
            id: submissionId,
            file: null,
            fileSize: 1523768,
        },
    };

    body.append('operations', JSON.stringify(operations));
    body.append('map', '{ "1": ["variables.file"] }');
    body.append(
        '1',
        fs.createReadStream(path.join(__dirname, './mock-data/disallowed.txt')),
        { filename: 'disallowed.txt' },
    );

    return await axios.post('http://localhost:3000/graphql', body, {
        headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
    });
};

export const startSubmission = async (apollo: ApolloClient<unknown>, articleType: string): Promise<FetchResult> => {
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

export const submit = async (apollo: ApolloClient<unknown>, id: string): Promise<FetchResult> => {
    const submit = gql`
        mutation submit($id: ID!) {
            submit(id: $id) {
                id
            }
        }
    `;

    return apollo.mutate({
        mutation: submit,
        variables: {
            id,
        },
    });
};

/**
 * This one is easier than above as you don't need to check for data not null etc...
 * in the returned response
 */
export const startSubmissionAlt = async (articleType: string): Promise<AxiosResponse> => {
    return axios.post(
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
                articleType,
            },
        },
        { headers: { Authorization: `Bearer ${jwtToken}` } },
    );
};
