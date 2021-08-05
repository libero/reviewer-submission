import * as PDFParser from 'pdf2json';
import { generateCoverLetter } from './coverLetter';

export interface ThingWithR {
    R: ThingWithT[];
}

export interface ThingWithT {
    T: string;
}
async function getTextFromPDF(document: Buffer): Promise<{ jsonData: string; errors: number }> {
    const pdfParser = new PDFParser();
    let errors = 0;

    pdfParser.on('pdfParser_dataError', (err: string) => {
        if (err) errors += 1;
    });
    const donePromise = new Promise<{ jsonData: string; errors: number }>(resolve => {
        pdfParser.on('pdfParser_dataReady', () => {
            const text = pdfParser.data.Pages[0].Texts.map((item: ThingWithR) =>
                item.R.map((t: ThingWithT) => t.T).reduce((prev: string, curr: string) => prev + curr),
            ).reduce((prev: string, curr: string) => prev + curr);

            resolve({ jsonData: JSON.stringify(text, null, 2), errors });
        });
    });
    await pdfParser.parseBuffer(document);
    return donePromise;
}

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
