import * as PDFParser from 'pdf2json';
import { generateDisclosure } from './disclosure';
import submission from './article.test.data';

function toContainChunk(data: Buffer, chunk: Buffer): boolean {
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
    } while (++offset < data.length - chunk.length);
    return false;
}

describe('Disclosure PDF generator', () => {
    it('returns a string of a PDF', async () => {
        const document = await generateDisclosure(submission, '1.2.3.4');
        expect(toContainChunk(document, Buffer.from(`5 0 obj\n<<\n/Length 5680\n`))).toBe(true);
    });
});
