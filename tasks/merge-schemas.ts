import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';
import { fileLoader, mergeTypes } from 'merge-graphql-schemas';

const typesArray = fileLoader(path.join(__dirname, '..', 'src', './schemas'));
const merged = mergeTypes(typesArray, { all: true });

util.promisify(fs.mkdir)('lint-schemas', { recursive: true })
    .then(_ => util.promisify(fs.writeFile)('lint-schemas/all.graphql', merged, { encoding: 'utf8' }))
    .then(_ => console.log('done'))
    .catch((e: Error) => console.log('Error', e));
