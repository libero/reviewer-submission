import { makeTransferFile } from './transfer';

describe('Transfer XML generator', () => {
    it('interpolates auth code', async () => {
        const xml = await makeTransferFile('1234abcd');
        expect(xml).toContain('<authentication-code>1234abcd</authentication-code>');
    });
});
