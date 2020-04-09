import axios from 'axios';
import { jwtToken, startSubmissionAlt } from './test.utils';
import { sign } from 'jsonwebtoken';
import config from '../src/config';

describe('Wizard->Pages Integration Tests', () => {
    it('it should allow a user to get their submission', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const getResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    query GetSubmission($id: ID!) {
                        getSubmission(id: $id) {
                            id,
                            articleType
                        }
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
        expect(getResponse.status).toBe(200);
        expect(getResponse.data.data.getSubmission.id).toBe(submissionId);
        expect(getResponse.data.data.getSubmission.articleType).toBe('research-article');
    });

    it('it should allow a user to get their submissions', async () => {
        await startSubmissionAlt('research-article');
        const getResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    query getSubmissions {
                        getSubmissions {
                            id,
                            articleType
                        }
                    }
                `,
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );
        expect(getResponse.status).toBe(200);
        expect(Array.isArray(getResponse.data.data.getSubmissions)).toBe(true);
        expect(getResponse.data.data.getSubmissions.length).toBeGreaterThan(1);
    });
    
    it('it should allow a user to set details', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const details = {
            title: 'title',
            subjects: ['subjects'],
            previouslyDiscussed: 'previous',
            previouslySubmitted: 'p1',
            cosubmission: 'co',
        };

        const saveDetailsResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation saveDetailsPage($id: ID!, $details: ManuscriptDetailsInput!) {
                        saveDetailsPage(id: $id, details: $details) {
                            id,
                            manuscriptDetails {
                                title,
                                subjects
                            }
                        }
                    }
                `,
                variables: {
                    id: submissionId,
                    details,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(saveDetailsResponse.status).toBe(200);
        expect(saveDetailsResponse.data.errors).toBeUndefined();
        expect(saveDetailsResponse.data.data.saveDetailsPage.manuscriptDetails.subjects).toEqual(details.subjects);
        expect(saveDetailsResponse.data.data.saveDetailsPage.manuscriptDetails.title).toEqual(details.title);
    });

    it("it should not allow a user to save details of another user's submission", async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const details = {
            title: 'title',
            subjects: ['subjects'],
            previouslyDiscussed: 'previous',
            previouslySubmitted: 'p1',
            cosubmission: 'co',
        };

        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, config.authentication_jwt_secret);

        const failedSaveDetailsResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation saveDetailsPage($id: ID!, $details: ManuscriptDetailsInput!) {
                        saveDetailsPage(id: $id, details: $details) {
                            id,
                            manuscriptDetails {
                                title,
                                subjects
                            }
                        }
                    }
                `,
                variables: {
                    id: submissionId,
                    details,
                },
            },
            {
                headers: { Authorization: `Bearer ${imposterToken}` },
            },
        );

        expect(failedSaveDetailsResponse.status).toBe(200);
        expect(failedSaveDetailsResponse.data.errors).toBeDefined();
        expect(failedSaveDetailsResponse.data.errors[0].message).toBe('User not allowed to update submission');
    });

    it('it should set author details', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const details = {
            firstName: 'jimmy',
            lastName: 'doe',
            email: 'jimmy@doe.com',
            institution: 'institution',
        };

        const saveAuthorPageResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation saveAuthorPage($id: ID!, $details: AuthorDetailsInput!) {
                        saveAuthorPage(id: $id, details: $details) {
                            id,
                            author {
                                firstName,
                                institution
                            }
                        }
                    }
                `,
                variables: {
                    id: submissionId,
                    details,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(saveAuthorPageResponse.status).toBe(200);
        expect(saveAuthorPageResponse.data.errors).toBeUndefined();
        expect(saveAuthorPageResponse.data.data.saveAuthorPage.author.firstName).toBe('jimmy');
        expect(saveAuthorPageResponse.data.data.saveAuthorPage.author.institution).toBe('institution');
    });
});
