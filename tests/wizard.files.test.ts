import axios, { AxiosResponse } from 'axios';
import { jwtToken, startSubmissionAlt } from './test.utils';
import { sign } from 'jsonwebtoken';
import config from '../src/config';
import * as FormData from 'form-data';

export const uploadManuscript = async (submissionId: string): Promise<AxiosResponse> => {
    const body = new FormData();
    const query = `mutation UploadManuscript($id: ID!, $file: Upload!, $fileSize: Int!) {
        uploadManuscript(id: $id, file: $file, fileSize: $fileSize) {
            id,
            manuscriptFile {
                id
            }
        }
    }`;

    const operations = {
        query: query,
        variables: {
            id: submissionId,
            file: null,
            fileSize: 2,
        },
    };

    body.append('operations', JSON.stringify(operations));
    body.append('map', '{ "1": ["variables.file"] }');
    body.append('1', 'a', { filename: 'a.txt' });

    return await axios.post('http://localhost:3000/graphql', body, {
        headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
    });
};

export const uploadSupportingFile = async (submissionId: string): Promise<AxiosResponse> => {
    const body = new FormData();
    const query = `mutation UploadSupportingFile($id: ID!, $file: Upload!, $fileSize: Int!) {
        uploadSupportingFile(id: $id, file: $file, fileSize: $fileSize) {
            id,
            manuscriptFile {
                id
            },
            supportingFiles {
                id
            }
        }
    }`;

    const operations = {
        query: query,
        variables: {
            id: submissionId,
            file: null,
            fileSize: 2,
        },
    };

    body.append('operations', JSON.stringify(operations));
    body.append('map', '{ "1": ["variables.file"] }');
    body.append('1', 'a', { filename: 'a.txt' });

    return await axios.post('http://localhost:3000/graphql', body, {
        headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
    });
};

describe('Wizard->Files Integration Tests', () => {
    it('it should allow a user to set a a cover letter for their submission', async () => {
        const startSubmissionResponse = await startSubmissionAlt('researchArticle');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const coverLetter = 'I am a cover';

        const updateCoverLetterResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation SaveFilesPage($id: ID!, $coverLetter: String!) {
                        saveFilesPage(id: $id, coverLetter: $coverLetter) {
                            id,
                            coverLetter
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
        expect(updateCoverLetterResponse.data.data.saveFilesPage.coverLetter).toBe(coverLetter);
    });

    // see https://github.com/libero/reviewer-submission/issues/109
    it('uploads a manuscript file', async () => {
        const startSubmissionResponse = await startSubmissionAlt('researchArticle');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadManuscript(submissionId);
        expect(uploadResponse.status).toBe(200);

        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.data.uploadManuscript.id).toBe(submissionId);
    });

    it('deletes a manuscript file', async () => {
        const startSubmissionResponse = await startSubmissionAlt('researchArticle');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;

        const uploadResponse = await uploadManuscript(submissionId);
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

    it('should upload a supporting file', async () => {
        const startResponse = await startSubmissionAlt('researchArticle');
        const submissionId = startResponse.data.data.startSubmission.id;

        const uploadManuscriptResponse = await uploadManuscript(submissionId);
        expect(uploadManuscriptResponse.status).toBe(200);
        expect(uploadManuscriptResponse.data.errors).toBeUndefined();

        const uploadResponse = await uploadSupportingFile(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadSupportingFile.manuscriptFile.id).toBe(
            uploadManuscriptResponse.data.data.uploadManuscript.manuscriptFile.id,
        );
        expect(uploadResponse.data.data.uploadSupportingFile.supportingFiles).toHaveLength(1);
    });

    it('it should throw if a user tries to delete a supporting file unrelated to their submission', async () => {
        const startResponse = await startSubmissionAlt('researchArticle');
        const submissionId = startResponse.data.data.startSubmission.id;

        const uploadManuscriptResponse = await uploadManuscript(submissionId);
        expect(uploadManuscriptResponse.status).toBe(200);
        expect(uploadManuscriptResponse.data.errors).toBeUndefined();

        const uploadResponse = await uploadSupportingFile(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadSupportingFile.manuscriptFile.id).toBe(
            uploadManuscriptResponse.data.data.uploadManuscript.manuscriptFile.id,
        );
        expect(uploadResponse.data.data.uploadSupportingFile.supportingFiles).toHaveLength(1);
        const imposterToken = sign({ sub: 'c0e74a86-2feb-435d-a50f-01f920334bc4' }, config.authentication_jwt_secret);

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation deleteSupportingFile($fileId: ID!, $submissionId: ID!) {
                        deleteSupportingFile(fileId: $fileId, submissionId: $submissionId)
                    }
                `,
                variables: {
                    fileId: uploadResponse.data.data.uploadSupportingFile.supportingFiles[0].id,
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
        const startResponse = await startSubmissionAlt('researchArticle');
        const submissionId = startResponse.data.data.startSubmission.id;

        const uploadManuscriptResponse = await uploadManuscript(submissionId);
        expect(uploadManuscriptResponse.status).toBe(200);
        expect(uploadManuscriptResponse.data.errors).toBeUndefined();

        const uploadResponse = await uploadSupportingFile(submissionId);
        expect(uploadResponse.status).toBe(200);
        expect(uploadResponse.data.errors).toBeUndefined();
        expect(uploadResponse.data.data.uploadSupportingFile.manuscriptFile.id).toBe(
            uploadManuscriptResponse.data.data.uploadManuscript.manuscriptFile.id,
        );
        expect(uploadResponse.data.data.uploadSupportingFile.supportingFiles).toHaveLength(1);

        const deleteResponse = await axios.post(
            'http://localhost:3000/graphql',
            {
                query: `
                    mutation deleteSupportingFile($fileId: ID!, $submissionId: ID!) {
                        deleteSupportingFile(fileId: $fileId, submissionId: $submissionId)
                    }
                `,
                variables: {
                    fileId: uploadResponse.data.data.uploadSupportingFile.supportingFiles[0].id,
                    submissionId,
                },
            },
            {
                headers: { Authorization: `Bearer ${jwtToken}` },
            },
        );

        expect(deleteResponse.status).toBe(200);
        expect(uploadManuscriptResponse.data.errors).toBeUndefined();
    });
});
