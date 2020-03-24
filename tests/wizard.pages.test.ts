import axios from 'axios';
import { jwtToken, startSubmissionAlt } from './test.utils';
import { sign } from 'jsonwebtoken';
import config from '../src/config';

describe('Wizard->Pages Integration Tests', () => {
    it('it should allow a user to set details', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const details = {
            title: 'title',
            subjects: ['subjects'],
            previouslyDiscussed: 'previous',
            previouslySubmitted: ['p1', 'p2'],
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
            previouslySubmitted: ['p1', 'p2'],
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
});
