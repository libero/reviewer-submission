import * as fs from 'fs-extra';
import * as pdf from 'html-pdf';

const toPdf = async (html: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        pdf.create(html).toBuffer((error, buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(buffer);
            }
        });
    });
};

export const generateCoverLetter = async (coverLetter = ''): Promise<Buffer> => {
    const template = await fs.readFile(`${__dirname}/templates/coverLetter.html`, 'utf8');
    const htmlContents = template.replace('{coverLetter}', coverLetter);
    return toPdf(htmlContents);
};
