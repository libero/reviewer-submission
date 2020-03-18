import { removeUnicode } from './remove-unicode';

describe('remove unicode', () => {
    it('leaves un-changed when no unicode', async () => {
        const test = 'The quick brown fox jumps over the lazy dog 0123456789';
        expect(removeUnicode(test, 0)).toBe('The quick brown fox jumps over the lazy dog 0123456789');
    });

    it('removes emoji', async () => {
        const test = 'My 😊 test file.txt';
        expect(removeUnicode(test, 3)).toBe('3_My  test file.txt');
    });

    it('removes common unicode', async () => {
        const test = '✓✗‒–—―⸺⸻〃§¶·‘’‚“”„†‡•…‽⁂←↑→↓☐☑☒☛☞⚜★☆□⛤';
        expect(removeUnicode(test, 9)).toBe('9_');
    });
});
