import axios from 'axios';
import { jwtToken, startSubmissionAlt, authenticationJwtSecret } from './test.utils';
import { sign } from 'jsonwebtoken';

describe('Wizard->Pages Integration Tests', () => {
    it('it should allow a user to get their submission', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
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
        expect(getResponse.data.errors).toBeUndefined();
        expect(getResponse.data.data.getSubmission.id).toBe(submissionId);
        expect(getResponse.data.data.getSubmission.articleType).toBe('research-article');
    });

    it('it should allow a user to get their submissions', async () => {
        const startResponse = await startSubmissionAlt('research-article');
        expect(startResponse.data.errors).toBeUndefined();
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
        expect(getResponse.data.errors).toBeUndefined();
        expect(Array.isArray(getResponse.data.data.getSubmissions)).toBe(true);
        expect(getResponse.data.data.getSubmissions.length).toBeGreaterThan(1);
    });

    it('it should allow a user to set details', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
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
        expect(startSubmissionResponse.data.errors).toBeUndefined();
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const details = {
            title: 'title',
            subjects: ['subjects'],
            previouslyDiscussed: 'previous',
            previouslySubmitted: 'p1',
            cosubmission: 'co',
        };

        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, authenticationJwtSecret);

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
        expect(startSubmissionResponse.data.errors).toBeUndefined();
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
    

    it('it should allow user to set editor details', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const details = {
            suggestedSeniorEditors: ['1111'],
            opposedSeniorEditors: ['2222'],
            opposedSeniorEditorsReason: 'because',
            suggestedReviewingEditors: ['3333'],
            opposedReviewingEditors: ['4444'],
            opposedReviewingEditorsReason: 'because 2',
            suggestedReviewers: [{
                email: 'jimmy@doe.com',
                name: 'name'
            }],
            opposedReviewers: [{
                email: 'jimmy@doe.com',
                name: 'name'
            }],
            opposedReviewersReason: 'because 3',
        };

        const saveEditorPageResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation saveEditorPage($id: ID!, $details: EditorDetailsInput!) {
                        saveEditorPage(id: $id, details: $details) {
                            id,
                            editorDetails {
                                suggestedSeniorEditors,
                                opposedSeniorEditors,
                                opposedSeniorEditorsReason,
                                suggestedReviewingEditors,
                                opposedReviewingEditors,
                                opposedReviewingEditorsReason,
                                suggestedReviewers {
                                    name,
                                    email
                                },
                                opposedReviewers {
                                    name,
                                    email
                                },
                                opposedReviewersReason
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

        expect(saveEditorPageResponse.status).toBe(200);
        expect(saveEditorPageResponse.data.errors).toBeUndefined();
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.suggestedSeniorEditors).toEqual(details.suggestedSeniorEditors);
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.opposedSeniorEditors).toEqual(details.opposedSeniorEditors);
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.opposedSeniorEditorsReason).toEqual(details.opposedSeniorEditorsReason);
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.suggestedReviewingEditors).toEqual(details.suggestedReviewingEditors);
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.opposedReviewingEditorsReason).toEqual(details.opposedReviewingEditorsReason);
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.suggestedReviewers).toEqual(details.suggestedReviewers);
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.opposedReviewers).toEqual(details.opposedReviewers);
        expect(saveEditorPageResponse.data.data.saveEditorPage.editorDetails.opposedReviewersReason).toEqual(details.opposedReviewersReason);

    });

    it('it should allow user to submit survey', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        expect(startSubmissionResponse.data.errors).toBeUndefined();
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const surveyResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation submitSurveyResponse($surveyId: String, $submissionId: String, $answers: [InputSurveyAnswer]!) {
                        submitSurveyResponse(surveyId: $surveyId, submissionId: $submissionId, answers: $answers) {
                            id,
                            created,
                            updated,
                            surveyId,
                            submissionId
                        }
                    }
                `,
                variables: {
                    surveyId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
                    submissionId: submissionId,
                    answers: [
                        {
                            questionId: '1',
                            text: 'question text 1',
                            answer: 'answer 1'
                        },
                        {
                            questionId: '2',
                            text: 'question text 2',
                            answer: 'answer 2'
                        }
                    ]
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(surveyResponse.status).toBe(200);
        expect(surveyResponse.data.errors).toBeUndefined();
        expect(surveyResponse.data.data).toBeDefined();
        expect(surveyResponse.data.data.submitSurveyResponse).toBeDefined();
        expect(surveyResponse.data.data.submitSurveyResponse.submissionId).toBe(submissionId);
        expect(surveyResponse.data.data.submitSurveyResponse.surveyId).toBe('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');
    });
});
