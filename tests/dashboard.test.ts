import { sign } from 'jsonwebtoken';
import axios from 'axios';
import ApolloClient from 'apollo-client';
import {
    createApolloClient,
    startSubmission,
    jwtToken,
    startSubmissionAlt,
    uploadManuscript,
    authenticationJwtSecret,
} from './test.utils';

describe('Dashboard Integration Tests', () => {
    let apollo: ApolloClient<unknown>;

    beforeEach(() => {
        apollo = createApolloClient();
    });

    it('returns no errors on valid research article', async () => {
        const response = await startSubmission(apollo, 'research-article');
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

    it('it should throw a user tries to delete a file unrelated to their submission', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadManuscript(submissionId);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.status).toBe(200);

        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, authenticationJwtSecret);

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation DeleteManuscript($fileId: ID!, $submissionId: ID!) {
                        deleteManuscript(fileId: $fileId, submissionId: $submissionId)
                    }
                `,
                variables: {
                    fileId: uploadResponse.data.data.uploadManuscript.files.manuscriptFile.id,
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
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
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

    it('it should return state as CONTINUE_SUBMISSION', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
        expect(startSubmissionResponse.data.data.startSubmission.status).toBe('CONTINUE_SUBMISSION');
    });

    it('it should allow users to get their submissions', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
        expect(startSubmissionResponse.data.data.startSubmission.status).toBe('CONTINUE_SUBMISSION');
        const submissionsResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    query getSubmissions {
                        getSubmissions {
                            id
                            lastStepVisited
                            manuscriptDetails {
                                title
                            }
                            updated
                            articleType
                            status
                        }
                    }
                `
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(submissionsResponse.status).toBe(200);
        expect(submissionsResponse.data.data).toBeDefined();
        expect(typeof submissionsResponse.data.data.getSubmissions[0].updated).toBe('string');
    });


    it('it should throw if the user tries to delete a submission that is not their own', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, authenticationJwtSecret);

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
