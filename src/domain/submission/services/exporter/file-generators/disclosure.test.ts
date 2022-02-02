import { generateDisclosure } from './disclosure';
import submission from './article.test.data';

function stringToHex(data: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += data.charCodeAt(i).toString(16);
    }
    console.log(`string: ${data}, hex: ${result}`);
    return result;
}

function pdfContainsText(pdf: Buffer, text: string): boolean {
    const hexText = stringToHex(text);
    let sectionStart = pdf.indexOf('[', 0);
    while (sectionStart !== -1) {
        const sectionEnd = pdf.indexOf(']', sectionStart);
        if (sectionEnd === -1) {
            return false;
        }

        let segment = '';
        let textChunkStart = pdf.indexOf('<', sectionStart);
        while (textChunkStart > sectionStart && textChunkStart < sectionEnd) {
            const textChunkEnd = pdf.indexOf('>', textChunkStart);

            for (let i = textChunkStart + 1; i < textChunkEnd; i++) {
                segment += String.fromCharCode(pdf[i]);
            }

            textChunkStart = pdf.indexOf('<', textChunkEnd);
        }

        if (segment === hexText) {
            return true;
        }

        sectionStart = pdf.indexOf('[', sectionEnd);
    }
    return false;
}

describe('Disclosure PDF generator', () => {
    it('returns a string of a PDF', async () => {
        const document = await generateDisclosure(submission, '1.2.3.4');
        expect(pdfContainsText(document, `604e06ca-882d-4b5b-a147-e016893e60e9`)).toBe(true);
        expect(pdfContainsText(document, `Test User`)).toBe(true);
        expect(pdfContainsText(document, `A.Scientist`)).toBe(true);
        expect(pdfContainsText(document, `1.2.3.4`)).toBe(true);
        expect(pdfContainsText(document, `Disclosure of Data to Editors`)).toBe(true);
        expect(
            pdfContainsText(
                document,
                `Our privacy policy explains that we share your personal information with various third `,
            ),
        ).toBe(true);
        expect(pdfContainsText(document, `I agree on behalf of all authors`)).toBe(true);
    });
});
