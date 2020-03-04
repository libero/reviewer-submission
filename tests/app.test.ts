import axios from 'axios';
import { sign } from 'jsonwebtoken';
import config from '../src/config';
import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, FetchResult } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';
import { GraphQLError } from 'graphql';

const jwtToken = sign({ sub: '123' }, config.authentication_jwt_secret);

let lastGQLError: string = '';

const createApolloClient = (): ApolloClient<unknown> => {
    return new ApolloClient<unknown>({
        link: ApolloLink.from([
            onError(({ graphQLErrors, networkError }) => {
                if (graphQLErrors)
                    graphQLErrors.forEach(({ message, locations, path }) => {
                        lastGQLError = message;
                        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`),
                    });
                if (networkError) console.log(`[Network error]: ${networkError}`);
            }),
            new HttpLink({
                uri: 'http://localhost:3000/graphql',
                credentials: 'same-origin',
            }),
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

const uploadManuscript = async (apollo: ApolloClient<unknown>, id: string): Promise<FetchResult> => {
    const buffer = Buffer.from('test');
    const file = Uint8Array.from(buffer).buffer;
    const fileSize = 2;
    const uploadManuscript = gql`
        mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
            uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
                id
            }
        }
    `;

    return apollo.mutate({
        mutation: uploadManuscript,
        variables: {
            id,
            file,
            fileSize,
        },
    });
};

describe('Application Integration Tests', () => {
    let apollo: ApolloClient<unknown>;

    beforeEach(() => {
        apollo = createApolloClient();
        lastGQLError = '';
    });

    it('returns no errors on valid research article', async () => {
        const response = await startSubmission(apollo, 'researchArticle');
        const data = response.data ? response.data : null;

        expect(data).toBeTruthy();
        const id = data && data.startSubmission ? data.startSubmission.id : '';
        expect(id).toHaveLength(36);
    });

    it.only('returns error on invalid research article', async () => {
        expect(await startSubmission(apollo, 'Bedtime story')).rejects.toThrow('Network error: Response not successful: Received status code 400');
        expect(lastGQLError).toBe('GraphQL error: Invalid article type');
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

    it.skip('uploads a manuscript file', async () => {
        const respStart = await startSubmission(apollo, 'researchArticle');
        const id = respStart.data && respStart.data.startSubmission ? respStart.data.startSubmission.id : '';
        expect(id).toHaveLength(36);

        const response = await uploadManuscript(apollo, id);
        const data = response.data ? response.data : {};
        expect(data.uploadManuscript.id).toBe(id);
    });
});
