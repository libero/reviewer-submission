import * as JsZip from 'jszip';
import { removeUnicode } from './remove-unicode';
import { ZipSourceFile } from './types';

export const makeZipBuffer = async (files: ZipSourceFile[]): Promise<Buffer> => {
    const zip = new JsZip();

    await Promise.all(
        Object.entries(files).map(async ([, file], index) => {
            zip.file(removeUnicode(file.filename, index), await file.content);
        }),
    );

    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
};
