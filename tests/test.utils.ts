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
import * as PDFParser from 'pdf2json';
export interface ThingWithR {
    R: ThingWithT[];
}

export interface ThingWithT {
    T: string;
}

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
                        console.log(
                            `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
                                locations,
                            )}, Path: ${path}`,
                        ),
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
    body.append('1', fs.createReadStream(path.join(__dirname, './mock-data/disallowed.txt')), {
        filename: 'disallowed.txt',
    });

    return await axios.post('http://localhost:3000/graphql', body, {
        headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
    });
};

export const uploadSupportingFile = async (submissionId: string): Promise<AxiosResponse> => {
    const body = new FormData();
    const query = `mutation UploadSupportingFile($id: ID!, $file: Upload!, $fileSize: Int!) {
        uploadSupportingFile(id: $id, file: $file, fileSize: $fileSize) {
            id,
            filename,
            url
        }
    }`;

    const operations = {
        query: query,
        variables: {
            id: submissionId,
            file: null,
            fileSize: 1,
        },
    };

    body.append('operations', JSON.stringify(operations));
    body.append('map', '{ "1": ["variables.file"] }');
    body.append('1', 'a', { filename: 'a.txt' });

    return await axios.post('http://localhost:3000/graphql', body, {
        headers: { Authorization: `Bearer ${jwtToken}`, ...body.getHeaders() },
    });
};

export const startSubmission = async (apollo: ApolloClient<unknown>, articleType: string): Promise<FetchResult> => {
    const startSubmission = gql`
        mutation StartSubmission($articleType: String!) {
            startSubmission(articleType: $articleType) {
                id,
                status
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

export const submit = async (id: string): Promise<AxiosResponse> => {
    return axios.post(
        'http://localhost:3000/graphql',
        {
            query: `
                mutation submit($id: ID!) {
                    submit(id: $id) {
                        id,
                        status
                    }
                }
            `,
            variables: {
                id,
            },
        },
        { headers: { Authorization: `Bearer ${jwtToken}` } },
    );
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
                        id,
                        status
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

export const saveAuthorDetails = async (submissionId: string, details: object): Promise<AxiosResponse> => {
    return await axios.post(
        'http://localhost:3000/graphql',
        {
            query: `
                mutation saveAuthorPage($id: ID!, $details: AuthorDetailsInput!) {
                    saveAuthorPage(id: $id, details: $details) {
                        id,
                        author {
                            firstName,
                            lastName,
                            email,
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
};

export const saveCoverLetter = async (submissionId: string, coverLetter: string): Promise<AxiosResponse> => {
    return await axios.post(
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
};

export const saveSubmissionDetails = async (submissionId: string, details: object): Promise<AxiosResponse> => {
    return await axios.post(
        'http://localhost:3000/graphql',
        {
            query: `
                mutation saveDetailsPage($id: ID!, $details: ManuscriptDetailsInput!) {
                    saveDetailsPage(id: $id, details: $details) {
                        id,
                        manuscriptDetails {
                            title,
                            subjects,
                            previouslyDiscussed,
                            previouslySubmitted,
                            cosubmission,
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
};

export const saveEditorDetails = async (submissionId: string, details: object): Promise<AxiosResponse> => {
    return await axios.post(
        'http://localhost:3000/graphql',
        {
            query: `
                mutation saveEditorPage($id: ID!, $details: EditorDetailsInput!) {
                    saveEditorPage(id: $id, details: $details) {
                        id,
                        author {
                            firstName,
                            lastName,
                            email,
                            institution
                        },
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
};

export const saveDisclosurePage = async (submissionId: string, details: object): Promise<AxiosResponse> => {
    return await axios.post(
        'http://localhost:3000/graphql',
        {
            query: `
                mutation saveDisclosurePage($id: ID!, $details: DisclosureDetailsInput!) {
                    saveDisclosurePage(id: $id, details: $details) {
                        id,
                        disclosure {
                            submitterSignature,
                            disclosureConsent
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
};

export const getTextFromPDF = (document: Buffer): Promise<{ jsonData: string; errors: number }> =>
    new Promise(resolve => {
        const pdfParser = new PDFParser();
        let errors = 0;

        pdfParser.on('pdfParser_dataError', (err: string) => {
            if (err) errors += 1;
            resolve({ errors, jsonData: '' });
        });
        pdfParser.on('pdfParser_dataReady', () => {
            const text = pdfParser.data.Pages[0].Texts.map((item: ThingWithR) =>
                item.R.map((t: ThingWithT) => t.T).reduce((prev: string, curr: string) => prev + curr),
            ).reduce((prev: string, curr: string) => prev + curr);

            resolve({ jsonData: JSON.stringify(text, null, 2), errors });
        });
        pdfParser.parseBuffer(document);
    });