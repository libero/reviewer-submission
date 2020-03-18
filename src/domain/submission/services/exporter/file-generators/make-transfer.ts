import * as fs from 'fs-extra';

export const makeTransferFile = async (code: string): Promise<string> => {
    const xml = await fs.readFile(`${__dirname}/templates/transfer.xml`, 'utf8');
    return xml.replace('{code}', code);
};
