import * as PDFDocument from 'pdfkit';
import Submission from '../../models/submission';

const privacyPolicy =
    'Our privacy policy explains that we share your personal information with various third parties to enable us to review ' +
    'and publish your manuscript, and that we protect your data with detailed contractual arrangements with those parties. ' +
    'One of the groups we need to share your data with is our international editors, guest editors, and potentially peer ' +
    'reviewers. Since they are carrying out their roles as individuals, it is impracticable for us to have such comprehensive ' +
    'contractual protection for your data with them as we have with other third parties. This means that your personal data ' +
    'is unlikely to have the same level of protection as it would if those editors and guest reviewers were based in the UK. ' +
    'Because of this risk, we ask for your explicit consent to share your personal data with them, which you can withdraw at ' +
    'any time (by emailing data@elifesciences.org). Please enter your name and check the box below to give this consent. ' +
    'Without this consent we will not be able to evaluate your submission.';

export const generateDisclosure = (submission: Submission, clientIp: string): Promise<Buffer> => {
    const header = {
        Journal: 'eLife',
        'Manuscript #': submission.id,
        Title: submission.manuscriptDetails.title,
        Submitter: `${submission.author?.firstName} ${submission.author?.lastName}`,
        Signature: `${submission.disclosure.submitterSignature}`,
        Date: new Date(),
        'IP Address': clientIp,
    };

    const doc = new PDFDocument({ compress: false });

    const bold = 'Helvetica-Bold';
    const normal = 'Helvetica';
    const gutter = 80;
    const lineSpacing = 15;

    // header
    Object.entries(header).forEach(([key, value], index) =>
        doc
            .font(bold)
            .text(key, gutter, gutter + index * lineSpacing)
            .font(normal)
            .text((value as unknown) as string, 200, gutter + index * lineSpacing),
    );

    // body
    doc.font(bold)
        .moveDown(2)
        .text('Disclosure of Data to Editors', gutter)
        .font(normal)
        .text(privacyPolicy)
        .moveDown(2)
        .text(`Name: ${header.Submitter}`);

    // checkbox + text (absolutely positioned)
    doc.text('I agree on behalf of all authors', 105, 445)
        .translate(gutter, 440)
        .scale(0.2)
        .path('M40.13 75.108L27.527 42.354l10.538-4.056 7.068 18.369L90.422 20.48l7.045 8.826z')
        .path('M73.393 54.837v22.825H20.071V24.34h53.322v4.745l7.529-6.01v-6.263H12.543V85.19h68.379V48.828z')
        .fill()
        .stroke();

    const promise = new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });

    doc.end();

    return promise;
};
