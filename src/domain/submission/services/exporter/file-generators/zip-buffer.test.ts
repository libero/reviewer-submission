import * as JsZip from 'jszip';
import { makeZipBuffer } from './zip-buffer';

describe('Generate ZIP archive', () => {
    it('returns a zip buffer', async () => {
        const buffer = await makeZipBuffer([]);
        expect(buffer.slice(0, 2).toString()).toEqual('PK');
    });

    it('buffer contains all files', async () => {
        const buffer = await makeZipBuffer([
            { filename: 'test.txt', content: Promise.resolve('This is a test') },
            { filename: 'other.pdf', content: Promise.resolve('PDF-1.3%') },
        ]);
        const zip = await JsZip.loadAsync(buffer);
        expect(zip.filter(() => true).map(file => file.name)).toEqual(['test.txt', 'other.pdf']);
    });

    it('waits for content', async () => {
        const buffer = await makeZipBuffer([
            {
                filename: 'async.txt',
                content: new Promise(resolve => setTimeout(() => resolve('some content'), 1)),
            },
        ]);
        const zip = await JsZip.loadAsync(buffer);
        const file = await zip?.file('async.txt')?.async('string');
        expect(file).toEqual('some content');
    });
});
