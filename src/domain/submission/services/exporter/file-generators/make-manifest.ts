import * as fs from 'fs-extra';
import * as entities from 'entities';
import { removeUnicode } from './remove-unicode';
import { FileData } from '../../../../file/services/models/file';

// replace a single key with a value
const replaceAll = (template: string, key: string, value: string): string => {
    const encodedValue = entities.encodeXML(value);
    return template.replace(new RegExp(`{${key}}`, 'g'), encodedValue);
};

// replace an array of keys with their values
const replaceDictionary = (template: string, dictionary: { key: string; value: string }[]): string => {
    let result = '';
    result += dictionary.reduce((xml, variable) => {
        return replaceAll(xml, variable.key, variable.value);
    }, template);

    return result;
};

const supplementaryXml = (files: FileData[]): string => {
    const fileList = files.filter(fileObject => fileObject.type === 'SUPPORTING_FILE');

    let supplementaryFileXml = '';
    const template = fs.readFileSync(`${__dirname}/templates/manifest-supplementary-file.xml`, 'utf8');

    fileList.forEach((file, index) => {
        const vars = [
            { key: 'id', value: (file.id as unknown) as string},
            { key: 'filename', value: removeUnicode(file.filename, index) },
            { key: 'mimeType', value: file.mimeType },
        ];

        supplementaryFileXml += replaceDictionary(template, vars);
    });

    return supplementaryFileXml;
};

export const makeManifestFile = (files: FileData[]): string => {
    if (!Array.isArray(files)) {
        throw new TypeError(`Expecting array: ${typeof files}`);
    }
    const manuscriptFiles = files.filter(file => file.type === 'MANUSCRIPT_SOURCE');
    if (manuscriptFiles.length > 1) {
        throw new Error(`Could not determine the manuscript, ${JSON.stringify(files, null, 4)}`);
    }
    const manuscript = manuscriptFiles[0];
    const template = fs.readFileSync(`${__dirname}/templates/manifest.xml`, 'utf8');
    const manuscriptFilename = removeUnicode(manuscript.filename, 0);

    const result = template
        .replace('{supplementaryFiles}', supplementaryXml(files))
        .replace('{manuscript.mimeType}', manuscript.mimeType);

    return replaceAll(result, 'manuscript.filename', manuscriptFilename);
};
