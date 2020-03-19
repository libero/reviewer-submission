import * as PDFParser from 'pdf2json';
import { makeDisclosurePdf } from './disclosure';
import { sampleManuscript } from './article.test.data';

describe('Disclosure PDF generator', () => {
    it('returns a string of a PDF', async () => {
        const document = await makeDisclosurePdf(
            sampleManuscript.id,
            sampleManuscript.title,
            {
                firstName: 'Test',
                lastName: 'User',
                email: 'elife@mailinator.com',
                aff: 'University of eLife',
            },
            sampleManuscript.submitterSignature,
            '1.2.3.4',
        );

        const pdfParser = new PDFParser();
        let errors = 0;
        pdfParser.on('pdfParser_dataError', (err: string) => {
            if (err) errors += 1;
        });

        expect(() => pdfParser.parseBuffer(document)).not.toThrow();
        pdfParser.on('pdfParser_dataReady', () => {
            expect(errors).toBe(0);
            expect(pdfParser.data).not.toBe(null);

            const jsonData = JSON.stringify(pdfParser.data);

            expect(jsonData.includes('Our%20privacy%20policy')).toBe(true);
            expect(jsonData.includes('Test%20User')).toBe(true);
            expect(jsonData.includes('A.Scientist')).toBe(true);
        });
    });
});
