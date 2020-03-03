import axios from 'axios';
import { sign } from 'jsonwebtoken';
import * as FormData from 'form-data';
import config from '../src/config';
import ApolloClient, { InMemoryCache, gql, FetchResult } from 'apollo-boost';

const jwtToken = sign({ sub: '123' }, config.authentication_jwt_secret);

const createApolloClient = (): ApolloClient<unknown> => {
    const uri = `http://localhost:3000/graphql`;

    return new ApolloClient({
        cache: new InMemoryCache(),
        uri,
        request: async (operation): Promise<void> => {
            operation.setContext({
                headers: {
                    authorization: `Bearer ${jwtToken}`,
                },
            });
        },
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
    const file = null;
    const fileSize = 2;
    const uploadManuscript = gql`mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
        uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
            id
        }
    }`;

    return apollo.mutate({
        mutation: uploadManuscript,
        variables: {
            id,
            file: null,
            fileSize: 2,
        },
    });
};

// addPhoto(file: File, description: string, tags: string) {
//     const addPhoto = gql`
//       mutation addPhoto(
//         $file: Upload!,
//         $description: String,
//         $tags: String
//       ){
//         addPhoto(
//           file: $file,
//           description: $description,
//           tags: $tags
//         ) {
//           id,
//           fileLocation,
//           description,
//           tags
//         }
//       }
//     `;
//     return this.apollo.mutate({
//       mutation: addPhoto,
//       variables: {
//         file,
//         description,
//         tags
//       },
//       context: {
//         useMultipart: true
//       }
//     })
//   }

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
        return expect(startSubmission(apollo, 'Bedtime story')).rejects.toThrow('GraphQL error: Invalid article type');
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

    it('uploads a manuscript file', async () => {
        const r1 = await startSubmission(apollo, 'researchArticle');
        // assert good

        const id = r1.data && r1.data.startSubmission ? r1.data.startSubmission.id : '';
        expect(id).toHaveLength(36);
        const r2 = await uploadManuscript(apollo, id);

        const data = r2.data ? r2.data : {};
        expect(data.uploadManuscript.id).toBe(id);
    });
});
