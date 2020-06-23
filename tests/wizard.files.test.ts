import axios from 'axios';
import {
    jwtToken,
    startSubmissionAlt,
    uploadManuscript,
    uploadLargeManuscript,
    uploadTooLargeManuscript,
    authenticationJwtSecret,
    uploadSupportingFile,
} from './test.utils';
import { sign } from 'jsonwebtoken';
import * as WebSocket from 'ws';

describe('Wizard->Files Integration Tests', () => {
    it('it should allow a user to set a blank cover letter for their submission', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const coverLetter = null;

        const updateCoverLetterResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation SaveFilesPage($id: ID!, $coverLetter: String) {
                        saveFilesPage(id: $id, coverLetter: $coverLetter) {
                            id,
                            files {
                                coverLetter
                            }
                        }
                    }
                `,
                variables: {
                    id: submissionId,
                    coverLetter,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(updateCoverLetterResponse.status).toBe(200);
        expect(updateCoverLetterResponse.data.errors).toBeUndefined();
        expect(updateCoverLetterResponse.data.data.saveFilesPage.files.coverLetter).toBe(coverLetter);
    });

    it('it should allow a user to set a a cover letter for their submission', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const coverLetter = 'I am a cover';

        const updateCoverLetterResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation SaveFilesPage($id: ID!, $coverLetter: String!) {
                        saveFilesPage(id: $id, coverLetter: $coverLetter) {
                            id,
                            files {
                                coverLetter
                            }
                        }
                    }
                `,
                variables: {
                    id: submissionId,
                    coverLetter,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(updateCoverLetterResponse.status).toBe(200);
        expect(updateCoverLetterResponse.data.errors).toBeUndefined();
        expect(updateCoverLetterResponse.data.data.saveFilesPage.files.coverLetter).toBe(coverLetter);
    });

    // see https://github.com/libero/reviewer-submission/issues/109
    it('uploads a manuscript file', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadManuscript(submissionId);
        expect(uploadResponse.status).toBe(200);

        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadManuscript.id).toBe(submissionId);
        expect(uploadResponse.data.data.uploadManuscript.suggestions[0]).toEqual({
            value: 'Impact of Coronavirus on Velociraptors',
            fieldName: 'title',
        });
    });

    it('uploads a manuscript file and replace previous', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadManuscript(submissionId);

        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadManuscript.id).toBe(submissionId);
        expect(uploadResponse.data.data.uploadManuscript.files.manuscriptFile).not.toBeNull();
        expect(uploadResponse.data.data.uploadManuscript.files.manuscriptFile.status).toBe('STORED');
        const manuscriptFileId = uploadResponse.data.data.uploadManuscript.files.manuscriptFile.id;
        const uploadResponse2 = await uploadManuscript(submissionId);
        expect(uploadResponse2.status).toBe(200);
        expect(uploadResponse2.data.errors).toBeUndefined();
        expect(uploadResponse2.data.data.uploadManuscript.id).toBe(submissionId);
        expect(uploadResponse2.data.data.uploadManuscript.files.manuscriptFile).not.toBeNull();
        expect(uploadResponse2.data.data.uploadManuscript.files.manuscriptFile.status).toBe('STORED');
        expect(uploadResponse2.data.data.uploadManuscript.files.manuscriptFile.id).not.toBe(manuscriptFileId);
    });

    it('uploads a large manuscript file', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadLargeManuscript(submissionId);

        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadManuscript.id).toBe(submissionId);
        expect(uploadResponse.data.data.uploadManuscript.files.manuscriptFile).not.toBeNull();
    });

    // File Size limit for test should be 150 bytes.
    it('uploads throw is the file exceed the size limit', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadTooLargeManuscript(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors[0].message).toBe('File truncated as it exceeds the 1000000 byte size limit.');
    });

    it('deletes a manuscript file', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadManuscript(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();

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
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data.errors).toBeUndefined();
    });

    it('should upload a supporting file', async () => {
        const startResponse = await startSubmissionAlt('research-article');
        const submissionId = startResponse.data.data.startSubmission.id;

        const uploadManuscriptResponse = await uploadManuscript(submissionId);
        expect(uploadManuscriptResponse.status).toBe(200);
        expect(uploadManuscriptResponse.data.errors).toBeUndefined();

        const uploadResponse = await uploadSupportingFile(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadSupportingFile).not.toBeNull();
        expect(uploadResponse.data.data.uploadSupportingFile.id).toBeDefined();
        expect(uploadResponse.data.data.uploadSupportingFile.filename).toBeDefined();
        expect(uploadResponse.data.data.uploadSupportingFile.url).toBeDefined();
    });

    it('it should throw if a user tries to delete a supporting file unrelated to their submission', async () => {
        const startResponse = await startSubmissionAlt('research-article');
        const submissionId = startResponse.data.data.startSubmission.id;

        const uploadManuscriptResponse = await uploadManuscript(submissionId);
        expect(uploadManuscriptResponse.status).toBe(200);
        expect(uploadManuscriptResponse.data.errors).toBeUndefined();

        const uploadResponse = await uploadSupportingFile(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadSupportingFile).not.toBeNull();
        expect(uploadResponse.data.data.uploadSupportingFile.id).toBeDefined();
        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, authenticationJwtSecret);

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation deleteSupportingFile($fileId: ID!, $submissionId: ID!) {
                        deleteSupportingFile(fileId: $fileId, submissionId: $submissionId)
                    }
                `,
                variables: {
                    fileId: uploadResponse.data.data.uploadSupportingFile.id,
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

    it('it should allow a user to delete a supporting file ', async () => {
        const startResponse = await startSubmissionAlt('research-article');
        const submissionId = startResponse.data.data.startSubmission.id;

        const uploadManuscriptResponse = await uploadManuscript(submissionId);
        expect(uploadManuscriptResponse.status).toBe(200);
        expect(uploadManuscriptResponse.data.errors).toBeUndefined();

        const uploadResponse = await uploadSupportingFile(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadSupportingFile).not.toBeNull();
        expect(uploadResponse.data.data.uploadSupportingFile.id).toBeDefined();

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation deleteSupportingFile($fileId: ID!, $submissionId: ID!) {
                        deleteSupportingFile(fileId: $fileId, submissionId: $submissionId)
                    }
                `,
                variables: {
                    fileId: uploadResponse.data.data.uploadSupportingFile.id,
                    submissionId,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.data.errors).toBeUndefined();
        expect(deleteResponse.data.data.deleteSupportingFile).toEqual(uploadResponse.data.data.uploadSupportingFile.id);
    });

    it('should give back progress on manuscript upload', async done => {
        const startResponse = await startSubmissionAlt('research-article');
        expect(startResponse.data.errors).toBeUndefined();
        const submissionId = startResponse.data.data.startSubmission.id;
        let percentage: string;

        const client = new WebSocket('ws://localhost:3000/graphql', 'graphql-ws', {
            headers: { Authorization: `Bearer ${jwtToken}` },
        });
        client.on('open', () => {
            client.send(
                JSON.stringify({
                    id: 1,
                    type: 'connection_init',
                    payload: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                }),
            );
        });
        client.on('message', (message: string) => {
            const result = JSON.parse(message);
            if (result.type === 'connection_ack') {
                client.send(
                    JSON.stringify({
                        id: 1,
                        type: 'start',
                        payload: {
                            operationName: 'FileUploadProgress',
                            query: `
                                subscription FileUploadProgress($submissionId: ID!) {
                                    fileUploadProgress(submissionId: $submissionId) {
                                        percentage
                                    }
                                }
                            `,
                            variables: {
                                submissionId,
                            },
                        },
                    }),
                );
            }
            if (result.type === 'data') {
                percentage = result.payload.data.fileUploadProgress.percentage;
                client.close();
            }
        });
        await uploadManuscript(submissionId);

        setTimeout(() => {
            expect(percentage).toBeDefined();
            expect(percentage).toBe('100');
            done();
        }, 500);
    });
});
