/* eslint-disable @typescript-eslint/no-explicit-any */
import ApolloClient from 'apollo-client';
import * as SftpClient from 'ssh2-sftp-client';
import * as JSZip from 'jszip';
import * as S3 from 'aws-sdk/clients/s3';
import {
    createApolloClient,
    startSubmission,
    submit,
    startSubmissionAlt,
    saveSubmissionDetails,
    saveAuthorDetails,
    uploadManuscript,
    uploadSupportingFile,
    saveEditorDetails,
    saveCoverLetter,
    saveDisclosurePage,
} from './test.utils';

const pollInterval = async (fn: () => Promise<any>): Promise<any> => {
    let count = 10;
    let result = false;
    while (count-- > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        result = await fn();

        if (result) {
            break;
        }
    }

    return result;
};

const checkArchive = async (content: string): Promise<void> => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(content);
    const fileNames = Object.keys(contents.files);

    expect(fileNames.sort()).toEqual([
        'a.txt',
        'article.xml',
        'cover_letter.pdf',
        'disclosure.pdf',
        'manifest.xml',
        'transfer.xml',
    ]);
};

describe('Submit Integration Tests', () => {
    let apollo: ApolloClient<unknown>;

    beforeEach(() => {
        apollo = createApolloClient();
    });

    it('cannot submit an invalid submission', async () => {
        const response = await startSubmission(apollo, 'research-article');
        const data = response.data ? response.data : null;

        expect(data).toBeTruthy();
        const id = data && data.startSubmission ? data.startSubmission.id : '';
        expect(id).toHaveLength(36);
        const status = data && data.startSubmission ? data.startSubmission.status : '';
        expect(status).toBe('CONTINUE_SUBMISSION');

        const submitResponse = await submit(id);
        expect(submitResponse.data.errors[0].message).toEqual('"manuscriptDetails.title" is required');
    });

    it('exports a meca archive', async () => {
        const startSubmissionResponse = await startSubmissionAlt('research-article');
        const submissionId = startSubmissionResponse.data.data.startSubmission.id;
        const authorDetails = {
            firstName: 'jimmy',
            lastName: 'doe',
            email: 'jimmy@doe.com',
            institution: 'institution',
        };
        const submissionDetails = {
            title: 'title',
            subjects: ['subjects'],
            previouslyDiscussed: 'previous',
            previouslySubmitted: 'p1',
            cosubmission: ['co'],
        };
        const editorDetails = {
            suggestedSeniorEditors: ['1111', '4444'],
            opposedSeniorEditors: ['2222'],
            opposedSeniorEditorsReason: 'because',
            suggestedReviewingEditors: ['3333', '5555'],
            opposedReviewingEditors: ['4444'],
            opposedReviewingEditorsReason: 'because 2',
            suggestedReviewers: [
                {
                    email: 'test1@doe-test.elifesciences.org',
                    name: 'name',
                },
            ],
            opposedReviewers: [
                {
                    email: 'test2@doe-test.elifesciences.org',
                    name: 'name',
                },
            ],
            opposedReviewersReason: 'because 3',
        };
        const disclosureDetails = {
            submitterSignature: 'signature',
            disclosureConsent: true,
        };

        await saveAuthorDetails(submissionId, authorDetails);
        await uploadManuscript(submissionId);
        await uploadSupportingFile(submissionId);
        await saveCoverLetter(submissionId, 'cover letter');
        await saveSubmissionDetails(submissionId, submissionDetails);
        await saveEditorDetails(submissionId, editorDetails);
        await saveDisclosurePage(submissionId, disclosureDetails);
        const submitResponse = await submit(submissionId);

        const sftpClient = new SftpClient();
        await sftpClient.connect({
            host: 'localhost',
            port: 2222,
            username: 'test',
            password: 'test',
        });

        const sftpFile = await pollInterval(async () => {
            const exists = (await sftpClient.exists(`./upload/${submissionId}-meca.zip`)) !== false;
            if (exists) {
                return (await sftpClient.get(`./upload/${submissionId}-meca.zip`)) as string;
            }
            return false;
        });

        await sftpClient.end();

        const s3Config = {
            accessKeyId: 'minio',
            secretAccessKey: 'minio123',
            apiVersion: '2006-03-01',
            signatureVersion: 'v4',
            s3ForcePathStyle: true,
            endpoint: 'http://localhost:9004',
        };

        const s3 = new S3(s3Config);
        const s3File = await pollInterval(async () => {
            try {
                const { Body } = await s3
                    .getObject({
                        Bucket: 'test',
                        Key: `meca-archive/${submissionId}-meca.zip`,
                    })
                    .promise();

                return Body;
            } catch (e) {
                return false;
            }
        });

        expect(sftpFile).toBeTruthy();
        expect(s3File).toBeTruthy();
        expect(submitResponse.data.data.submit.status).toBe('SUBMITTED');

        await checkArchive(sftpFile);
        await checkArchive(s3File);
    });
});
