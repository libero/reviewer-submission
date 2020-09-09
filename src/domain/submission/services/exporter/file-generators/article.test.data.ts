import File from '../../../../file/services/models/file';
import { FileId, FileType } from '../../../../file/types';
import { SubmissionId } from '../../../types';
import Submission, { ArticleType } from '../../models/submission';

const submission = new Submission({
    id: SubmissionId.fromUuid('604e06ca-882d-4b5b-a147-e016893e60e9'),
    created: new Date('2018-09-07T12:25:53.196Z').toISOString(),
    updated: new Date('2018-09-07T12:25:53.196Z').toISOString(),
    createdBy: '6d8cd1ce-15b6-46c1-b901-bc91598c8f2d',
    status: 'INITIAL',
    articleType: ArticleType.RESEARCH_ARTICLE,
});

submission.author = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    institution: 'University of eLife',
};

submission.manuscriptDetails = {
    title: 'Test Manuscript',
    subjects: ['biochemistry-chemical-biology', 'chromosomes-gene-expression'],
    previouslyDiscussed: 'Talked to bob about it',
    previouslySubmitted: 'Original Test Title',
    cosubmission: ['asdassss', 'Another'],
};

submission.editorDetails = {
    opposedReviewingEditors: ['87f34696'],
    suggestedReviewingEditors: ['6fabd619', 'fd8295ba'],
    suggestedSeniorEditors: ['1e9e661f', '3edb2ed8'],
    opposedSeniorEditors: ['232d9893'],
    suggestedReviewers: [
        {
            name: 'J. Edward Reviewer',
            email: 'edward@example.com',
        },
        {
            name: 'Frances de Reviewer',
            email: 'frances@example.org',
        },
        {
            name: 'Gertrude Reviewer',
            email: 'gertrude@example.net',
        },
    ],
    opposedReviewers: [
        {
            name: 'Hoo',
            email: 'laughing@example.com',
        },
        {
            name: 'Who',
            email: 'singing@example.com',
        },
    ],
    opposedSeniorEditorsReason: 'From another galaxy',
    opposedReviewingEditorsReason: 'Not any more',
    opposedReviewersReason: 'Wandering days are over',
};

submission.disclosure = {
    submitterSignature: 'A.Scientist',
    disclosureConsent: false,
};

submission.files = {
    coverLetter: '',
    manuscriptFile: new File({
        status: 'CREATED',
        id: FileId.fromUuid('00000000-6c48-4747-851c-ef806e8486b2'),
        size: 0,
        type: FileType.MANUSCRIPT_SOURCE,
        filename: '00000000-6c48-4747-851c-ef806e8486b2.pdf',
        mimeType: 'application/pdf',
        submissionId: SubmissionId.fromUuid('604e06ca-882d-4b5b-a147-e016893e60e9'),
    }),
    supportingFiles: [
        new File({
            status: 'CREATED',
            id: FileId.fromUuid('00000001-6c48-4747-851c-ef806e8486b2'),
            size: 0,
            type: FileType.SUPPORTING_FILE,
            filename: '👉👉👉00000001&1.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            submissionId: SubmissionId.fromUuid('604e06ca-882d-4b5b-a147-e016893e60e9'),
        }),
        new File({
            id: FileId.fromUuid('00000002-6c48-4747-851c-ef806e8486b2'),
            submissionId: SubmissionId.fromUuid('604e06ca-882d-4b5b-a147-e016893e60e9'),
            type: FileType.SUPPORTING_FILE,
            filename: '👍👍👍000000002©.pdf',
            mimeType: 'application/pdf',
            size: 0,
            status: 'CREATED',
        }),
    ],
};

export default submission;
