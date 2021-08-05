import { getTextFromPDF } from '../../../../../../tests/test.utils';
import { generateDisclosure } from './disclosure';
import submission from './article.test.data';

describe('Disclosure PDF generator', () => {
    it('returns a string of a PDF', async () => {
        const document = await generateDisclosure(submission, '1.2.3.4');
        const { jsonData, errors } = await getTextFromPDF(document);
        expect(errors).toBe(0);
        expect(jsonData.includes('Our%20privacy%20policy')).toBe(true);
        expect(jsonData.includes('Test%20User')).toBe(true);
        expect(jsonData.includes('A.Scientist')).toBe(true);
    });
});
