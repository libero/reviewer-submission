import * as PDFParser from 'pdf2json';
import { generateDisclosure } from './disclosure';
import submission from './article.test.data';

function toContainChunk(data: Uint8Array[], chunk: Uint8Array[]): boolean {
    let offset = 0;
    do {
        if (data[offset] === chunk[0]) {
            for (let i = 1; i < chunk.length; i++) {
                if (data[offset + i] !== chunk[i]) {
                    break;
                }

                if (i + 1 === chunk.length) {
                    return true;
                }
            }
        }
    } while (++offset < data.length);
    return false;

    /*
    const headIndex = data.indexOf(chunk[0]);
    let pass = headIndex !== -1;
    if (pass) {
        for (let i = 1; i < chunk.length; ++i) {
            if (chunk[i] instanceof RegExp) {
                pass = pass && chunk[i].test(data[headIndex + i]);
            } else {
                pass = pass && this.equals(data[headIndex + i], chunk[i]);
            }
        }
    }
    return pass;
    */
}

describe('Disclosure PDF generator', () => {
    it('returns a string of a PDF', async () => {
        const document = await generateDisclosure(submission, '1.2.3.4');

        const donePromise = new Promise<void>((resolve, reject) => {
            console.log('PDFParser: construct...');
            const pdfParser = new PDFParser();

            pdfParser.on('pdfParser_dataError', () => reject);

            pdfParser.on('pdfParser_dataReady', () => {
                /*
                const jsonData = JSON.stringify(pdfParser.data);
                console.log(jsonData);
                expect(jsonData.includes('Our%20privacy%20policy')).toBe(true);
                expect(jsonData.includes('Test%20User')).toBe(true);
                expect(jsonData.includes('A.Scientist')).toBe(true);
                */
                resolve();
            });

            pdfParser.parseBuffer(document).catch(() => reject);
        });

        await donePromise;
    });
});
