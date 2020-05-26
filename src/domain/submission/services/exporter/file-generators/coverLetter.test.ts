import * as PDFParser from 'pdf2json';
import { generateCoverLetter } from './coverLetter';

export interface ThingWithR {
    R: ThingWithT[];
}

export interface ThingWithT {
    T: string;
}

const coverLetter = "<h1>Pick Me!</h1><p>I'm simply the best</p>";

describe('Cover letter PDF generator', () => {
    it('returns PDF document', async () => {
        const pdf = await generateCoverLetter(coverLetter);
        const pdfString = pdf.toString();
        expect(pdfString.indexOf('%PDF')).toBe(0);
    });

    it('PDF document contains the cover letter', async () => {
        const document = await generateCoverLetter(coverLetter);

        const pdfParser = new PDFParser();
        let errors = 0;
        pdfParser.on('pdfParser_dataError', (err: string) => {
            if (err) errors += 1;
        });

        expect(() => pdfParser.parseBuffer(document)).not.toThrow();
        pdfParser.on('pdfParser_dataReady', () => {
            expect(errors).toBe(0);
            expect(pdfParser.data).not.toBe(null);

            const text = pdfParser.data.Pages[0].Texts.map((item: ThingWithR) =>
                item.R.map((t: ThingWithT) => t.T).reduce((prev: string, curr: string) => prev + curr),
            ).reduce((prev: string, curr: string) => prev + curr);

            const jsonData = JSON.stringify(text, null, 2);
            expect(jsonData).toBe('"%20C%20overLetterPickMe!I\'msimplythebest"');
        });
    });
});
