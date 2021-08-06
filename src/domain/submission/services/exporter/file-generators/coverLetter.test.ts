import { generateCoverLetter } from './coverLetter';
import { getTextFromPDF } from '../../../../../../tests/test.utils';

const coverLetter = "<h1>Pick Me!</h1><p>I'm simply the best</p>";

describe('Cover letter PDF generator', () => {
    it('returns PDF document', async () => {
        const pdf = await generateCoverLetter(coverLetter);
        const pdfString = pdf.toString();
        expect(pdfString.indexOf('%PDF')).toBe(0);
    });
    it('returns empty PDF document if cover letter is empty', async () => {
        const document = await generateCoverLetter();
        const { jsonData, errors } = await getTextFromPDF(document);
        expect(errors).toBe(0);
        expect(jsonData).toBe('"%20C%20overLetter"');
    });
    it('PDF document contains the cover letter', async () => {
        const document = await generateCoverLetter(coverLetter);
        const { jsonData, errors } = await getTextFromPDF(document);
        expect(errors).toBe(0);
        expect(jsonData).toBe('"%20C%20overLetterPickMe!I\'msimplythebest"');
    });
});
