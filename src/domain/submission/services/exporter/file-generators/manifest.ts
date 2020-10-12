import * as fs from 'fs-extra';
import * as entities from 'entities';
import { removeUnicode } from './remove-unicode';
import File from '../../../../file/services/models/file';
import Submission from '../../models/submission';

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

const supplementaryXml = (files: File[], startingIndex: number): string => {
    const fileList = files.filter(fileObject => fileObject.type === 'SUPPORTING_FILE');

    let supplementaryFileXml = '';
    const template = fs.readFileSync(`${__dirname}/templates/manifest-supplementary-file.xml`, 'utf8');

    fileList.forEach((file, index) => {
        const vars = [
            { key: 'id', value: (file.id as unknown) as string },
            { key: 'filename', value: removeUnicode(file.filename, startingIndex + index) },
            { key: 'mimeType', value: file.mimeType },
        ];

        supplementaryFileXml += replaceDictionary(template, vars);
    });

    return supplementaryFileXml;
};

export const generateManifest = (submission: Submission): string => {
    const manuscriptFile = submission.files.manuscriptFile;
    if (!manuscriptFile) {
        throw new Error(`Could not determine the manuscript: ${submission.id}`);
    }

    const template = fs.readFileSync(`${__dirname}/templates/manifest.xml`, 'utf8');
    // manuscript is always the 5th index of files array after the 5 MECA generated xml / pdf files
    const manuscriptFileZipIndex = 5;
    const supportingFileZipStartingIndex = manuscriptFileZipIndex + 1;
    const manuscriptFilename = removeUnicode(manuscriptFile.filename, manuscriptFileZipIndex);

    const result = template
        .replace(
            '{supplementaryFiles}',
            supplementaryXml(submission.files.supportingFiles || [], supportingFileZipStartingIndex),
        )
        .replace('{manuscript.mimeType}', manuscriptFile.mimeType);

    return replaceAll(result, 'manuscript.filename', manuscriptFilename);
};
